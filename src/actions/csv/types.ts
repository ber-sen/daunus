export interface CSVParams<T> {
  rows: ReadableStream<T>;
  columns?: Column<T, keyof T>[];
}

export interface Column<T, K extends keyof T> {
  key: K;
  label: string;
  format: (value: T[K], row: T) => unknown;
}
