import client from './client';

/**
 * Types for Auth payload and response.
 */
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  establishment_id?: number | null;
  establishment?: {
    name: string;
  };
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Login function.
 * Connects to the Laravel backend login endpoint.
 */
export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await client.post<LoginResponse>('/login', { email, password });
  return data;
};

/**
 * Logout function.
 * Revokes the token on the server.
 */
export const logoutRequest = async (): Promise<void> => {
  await client.post('/logout');
};

/**
 * Me function.
 * Fetches the authenticated user's data.
 */
export const getMe = async (): Promise<User> => {
  const { data } = await client.get<User>('/me');
  return data;
};
