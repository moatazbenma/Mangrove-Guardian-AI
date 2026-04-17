import { jwtDecode } from "jwt-decode";
import api from "./api";
import { isTokenExpired, refreshAccessToken } from "./tokens";

interface TokenPayload {
  username: string;
  role: string;
  is_approved: boolean;
  exp: number;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  role: string;
}

// Re-export token utilities for backward compatibility
export { isTokenExpired, refreshAccessToken };

export function getUserRole(): string | null {
  const token = localStorage.getItem("access");
  if (!token) return null;
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.role;
  } catch {
    return null;
  }
}

export function isUserApproved(): boolean {
  const token = localStorage.getItem("access");
  if (!token) return false;
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return decoded.is_approved !== false; // Default to true if not present
  } catch {
    return false;
  }
}

// Logout function - clear tokens
export function logout(): void {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await api.post<RegisterResponse>("/register/", payload);
  return res.data;
}
