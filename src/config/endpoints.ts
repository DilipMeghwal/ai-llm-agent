export const ENDPOINTS = {
  USERS: {
    BASE: '/api/v1/users',
    BY_ID: (id: string | number) => `/api/v1/users/${id}`,
    RESET_PASSWORD: (id: string | number) => `/api/v1/users/${id}/reset-password`,
  },
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
  },
  MISC: {
    LOGIN: (username: string, password: string) =>
      `/login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
  },
} as const;
