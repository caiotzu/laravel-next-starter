export interface LaravelPaginationLink {
  url: string | null;
  label: string;
  page: number | null;
  active: boolean;
}

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
