/** Forma del ErrorResource que devuelve el backend en cualquier error. */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  details: string[];
}
