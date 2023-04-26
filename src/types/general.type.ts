export interface Response {
  statusCode: number;
  timestamp: number;
  path: string;
  message: string;
}

export interface Page<Type> {
  items: Array<Type>;
  currentPage: number;
  totalPage: number;
  count?: number;
}
