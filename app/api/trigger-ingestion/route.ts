import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Verify the request is authorized
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    console.log('🔄 Starting batch news ingestion process...')
    
    // Orchestrate batch processing
    let batchOffset = 0
    const batchSize = 3 // Process 3 sources per batch
    let totalProcessed = 0
    let totalInserted = 0
    let allErrors: string[] = []
    let batchCount = 0
    const maxBatches = 20 // Safety limit to prevent infinite loops
    
    while (batchCount < maxBatches) {
      batchCount++
      console.log(`📦 Processing batch ${batchCount} (offset: ${batchOffset})...`)
      
      try {
        // Add timeout to prevent hanging requests (5 minutes max)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutes

        const response = await fetch(`${supabaseUrl}/functions/v1/news-ingestion`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            triggered_by: 'github-actions',
            timestamp: new Date().toISOString(),
            batch_size: batchSize,
            batch_offset: batchOffset
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Batch ${batchCount} failed:`, response.status, errorText)
          allErrors.push(`Batch ${batchCount}: HTTP ${response.status} - ${errorText}`)
          break // Stop processing on HTTP errors
        }

        const batchResult = await response.json()
        console.log(`✅ Batch ${batchCount} completed:`, {
          processed: batchResult.processed,
          inserted: batchResult.inserted,
          sources: batchResult.sources_processed,
          hasMore: batchResult.batch_info?.has_more_batches
        })
        
        // Accumulate results
        totalProcessed += batchResult.processed || 0
        totalInserted += batchResult.inserted || 0
        
        if (batchResult.errors && batchResult.errors.length > 0) {
          allErrors.push(...batchResult.errors.map((err: string) => `Batch ${batchCount}: ${err}`))
        }
        
        // Check if there are more batches to process
        if (!batchResult.batch_info?.has_more_batches) {
          console.log('🏁 All batches completed')
          break
        }
        
        // Update offset for next batch
        batchOffset = batchResult.batch_info.next_batch_offset
        
        // Add a small delay between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (batchError) {
        if (batchError instanceof Error && batchError.name === 'AbortError') {
          console.error(`⏱️  Batch ${batchCount} timed out after 5 minutes`)
          allErrors.push(`Batch ${batchCount}: Request timeout (exceeded 5 minutes)`)
        } else {
          console.error(`❌ Error in batch ${batchCount}:`, batchError)
          allErrors.push(`Batch ${batchCount}: ${batchError instanceof Error ? batchError.message : String(batchError)}`)
        }
        break // Stop processing on errors
      }
    }
    
    const executionTime = Date.now() - startTime
    const finalResult = {
      success: true,
      message: 'Batch news ingestion completed',
      summary: {
        total_processed: totalProcessed,
        total_inserted: totalInserted,
        batches_executed: batchCount,
        execution_time_ms: executionTime,
        execution_time_seconds: Math.round(executionTime / 1000)
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
      timestamp: new Date().toISOString()
    }
    
    console.log('🎉 News ingestion orchestration completed:', finalResult.summary)
    
    return NextResponse.json(finalResult)

  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('💥 Fatal error in ingestion orchestration:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
