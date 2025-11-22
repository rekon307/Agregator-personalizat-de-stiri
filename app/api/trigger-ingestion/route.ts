import { NextRequest, NextResponse } from 'next/server';
import { ingestionRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify the request is authorized
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';

    if (authHeader !== `Bearer ${expectedToken}`) {
      logger.warn('Unauthorized ingestion attempt', {
        ip: request.ip,
        headers: Object.fromEntries(request.headers.entries()),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply rate limiting (10 requests per 60 seconds)
    const identifier = request.ip ?? 'cron-trigger';
    const { success, limit, reset, remaining } = await ingestionRateLimit.limit(identifier);

    if (!success) {
      logger.warn('Rate limit exceeded for ingestion endpoint', {
        identifier,
        limit,
        reset,
      });
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many ingestion requests. Please try again later.',
          retry_after: reset,
        },
        {
          status: 429,
          headers: getRateLimitHeaders({ limit, reset, remaining }),
        }
      );
    }

    // Get Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      logger.error('Missing Supabase configuration');
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }

    logger.info('Starting batch news ingestion process');

    // Orchestrate batch processing
    let batchOffset = 0;
    const batchSize = 3; // Process 3 sources per batch
    let totalProcessed = 0;
    let totalInserted = 0;
    const allErrors: string[] = [];
    let batchCount = 0;
    const maxBatches = 20; // Safety limit to prevent infinite loops

    while (batchCount < maxBatches) {
      batchCount++;
      logger.info('Processing batch', { batchNumber: batchCount, offset: batchOffset });

      try {
        // Add timeout to prevent hanging requests (5 minutes max)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

        const response = await fetch(`${supabaseUrl}/functions/v1/news-ingestion`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            triggered_by: 'github-actions',
            timestamp: new Date().toISOString(),
            batch_size: batchSize,
            batch_offset: batchOffset,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Batch processing failed', {
            batchNumber: batchCount,
            status: response.status,
            error: errorText,
          });
          allErrors.push(`Batch ${batchCount}: HTTP ${response.status} - ${errorText}`);
          break; // Stop processing on HTTP errors
        }

        const batchResult = await response.json();
        logger.info('Batch completed', {
          batchNumber: batchCount,
          processed: batchResult.processed,
          inserted: batchResult.inserted,
          sources: batchResult.sources_processed,
          hasMore: batchResult.batch_info?.has_more_batches,
        });

        // Accumulate results
        totalProcessed += batchResult.processed || 0;
        totalInserted += batchResult.inserted || 0;

        if (batchResult.errors && batchResult.errors.length > 0) {
          allErrors.push(...batchResult.errors.map((err: string) => `Batch ${batchCount}: ${err}`));
        }

        // Check if there are more batches to process
        if (!batchResult.batch_info?.has_more_batches) {
          logger.info('All batches completed');
          break;
        }

        // Update offset for next batch
        batchOffset = batchResult.batch_info.next_batch_offset;

        // Add a small delay between batches to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (batchError) {
        if (batchError instanceof Error && batchError.name === 'AbortError') {
          logger.error('Batch timeout', { batchNumber: batchCount, timeout: '5 minutes' });
          allErrors.push(`Batch ${batchCount}: Request timeout (exceeded 5 minutes)`);
        } else {
          logger.error('Batch error', {
            batchNumber: batchCount,
            error: batchError instanceof Error ? batchError.message : String(batchError),
          });
          allErrors.push(
            `Batch ${batchCount}: ${batchError instanceof Error ? batchError.message : String(batchError)}`
          );
        }
        break; // Stop processing on errors
      }
    }

    const executionTime = Date.now() - startTime;
    const finalResult = {
      success: true,
      message: 'Batch news ingestion completed',
      summary: {
        total_processed: totalProcessed,
        total_inserted: totalInserted,
        batches_executed: batchCount,
        execution_time_ms: executionTime,
        execution_time_seconds: Math.round(executionTime / 1000),
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
      timestamp: new Date().toISOString(),
    };

    logger.info('News ingestion orchestration completed', finalResult.summary);

    return NextResponse.json(finalResult);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error('Fatal error in ingestion orchestration', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      executionTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
