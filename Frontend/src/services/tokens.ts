import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  username: string;
  role: string;
  is_approved: boolean;
  exp: number;
}

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
