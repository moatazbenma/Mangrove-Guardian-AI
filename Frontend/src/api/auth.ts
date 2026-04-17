import { jwtDecode } from "jwt-decode";
import api from "./axios";

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

// Check if token is expired or about to expire (within 1 minute)
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    const currentTime = Date.now() / 1000; // Convert to seconds
    const expirationBuffer = 60; // Refresh 1 minute before expiration
    return decoded.exp < (currentTime + expirationBuffer);
  } catch {
    return true;
  }
}







// Refresh access token using refresh token
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh");
  if (!refreshToken) return false;

  try {
    const response = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access", data.access);
      return true;
    } else {
      // Refresh token is invalid, clear storage and return false
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return false;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
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