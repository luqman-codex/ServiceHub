import { PaginationMeta } from '../types/dto';

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface OffsetLimit {
  limit: number;
  offset: number;
}

/** Parse validated page/page_size into Sequelize limit/offset. */
export function toOffsetLimit({ page, page_size }: PaginationParams): OffsetLimit {
  return { limit: page_size, offset: (page - 1) * page_size };
}

/** Build the PaginationMeta envelope segment (02 §7.1). */
export function buildPaginationMeta(
  { page, page_size }: PaginationParams,
  total_items: number,
): PaginationMeta {
  const total_pages = page_size > 0 ? Math.ceil(total_items / page_size) : 0;
  return {
    page,
    page_size,
    total_items,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
}
