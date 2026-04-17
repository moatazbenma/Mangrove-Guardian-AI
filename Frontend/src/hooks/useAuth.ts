import { useEffect, useState } from "react";
import { getUserRole as _getUserRole, isUserApproved as _isUserApproved, logout } from "../services/auth";

export interface UseAuthReturn {
  role: string | null;
  isApproved: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [role, setRole] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    setRole(_getUserRole());
    setIsApproved(_isUserApproved());
  }, []);

  return {
    role,
    isApproved,
    isAuthenticated: !!role,
    logout,
  };
}
