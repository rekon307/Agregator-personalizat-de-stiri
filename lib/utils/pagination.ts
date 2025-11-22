/**
 * Cursor-based pagination utilities
 * More efficient than offset/limit for large datasets
 */

/**
 * Encode cursor (typically an ID or timestamp)
 */
export function encodeCursor(value: string | number): string {
  return Buffer.from(String(value)).toString('base64');
}

/**
 * Decode cursor back to original value
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Pagination result type
 */
export interface PaginatedResult<T> {
  items: T[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
    totalCount?: number;
  };
}

/**
 * Create pagination info from items
 */
export function createPaginationInfo<T extends { id: string }>(
  items: T[],
  limit: number,
  hasMore: boolean
): PaginatedResult<T>['pageInfo'] {
  const hasNextPage = hasMore;
  const hasPreviousPage = false; // Can be enhanced based on your needs

  return {
    hasNextPage,
    hasPreviousPage,
    startCursor: items.length > 0 ? encodeCursor(items[0].id) : null,
    endCursor: items.length > 0 ? encodeCursor(items[items.length - 1].id) : null,
  };
}

/**
 * Parse pagination parameters from request
 */
export interface PaginationParams {
  limit: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 20,
  maxLimit: number = 100
): PaginationParams {
  const limitParam = searchParams.get('limit');
  const cursorParam = searchParams.get('cursor');
  const directionParam = searchParams.get('direction');

  let limit = defaultLimit;
  if (limitParam) {
    const parsed = parseInt(limitParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, maxLimit);
    }
  }

  return {
    limit,
    cursor: cursorParam || undefined,
    direction: directionParam === 'backward' ? 'backward' : 'forward',
  };
}

/**
 * Build pagination query for Supabase
 */
export interface SupabasePaginationQuery {
  limit: number;
  filter?: {
    column: string;
    operator: 'gt' | 'lt';
    value: string;
  };
}

export function buildSupabasePagination(
  params: PaginationParams,
  cursorColumn: string = 'id'
): SupabasePaginationQuery {
  const query: SupabasePaginationQuery = {
    limit: params.limit + 1, // Fetch one extra to check if there's more
  };

  if (params.cursor) {
    const decodedCursor = decodeCursor(params.cursor);
    query.filter = {
      column: cursorColumn,
      operator: params.direction === 'backward' ? 'lt' : 'gt',
      value: decodedCursor,
    };
  }

  return query;
}

/**
 * Process paginated results from database
 */
export function processPaginatedResults<T extends { id: string }>(
  results: T[],
  limit: number
): PaginatedResult<T> {
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  return {
    items,
    pageInfo: createPaginationInfo(items, limit, hasMore),
  };
}

/**
 * Time-based cursor utilities (for articles sorted by published_at)
 */
export interface TimeBasedCursor {
  timestamp: string;
  id: string;
}

export function encodeTimeCursor(timestamp: string, id: string): string {
  const cursor: TimeBasedCursor = { timestamp, id };
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeTimeCursor(cursor: string): TimeBasedCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
