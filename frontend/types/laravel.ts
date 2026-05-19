export interface LaravelPaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

export interface LaravelPaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links: LaravelPaginationLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface LaravelPaginationUrls {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

/**
 * Padrão (JSON:API-like)
 */
export interface LaravelResourcePagination<T> {
  data: T[];
  links: LaravelPaginationUrls;
  meta: LaravelPaginationMeta;
}

/**
 * Padrão pagination cru do laravel
 */
export interface LaravelPagination<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: LaravelPaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}




