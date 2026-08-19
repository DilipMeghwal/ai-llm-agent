export interface ResetPasswordRequest {
  newPassword?: string;
}

export interface ResetPasswordResponse {
  message?: string;
  success?: boolean;
  updatedAt?: string;
}

export interface ErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface User {
  id: string | number;
  username: string;
  email: string;
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password?: string;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  message?: string;
}
