import { createContext, PropsWithChildren, useContext, useState } from "react";

import { requestOtp, verifyOtp } from "../services/api";
import { AuthUser, Role } from "../types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  login: (phone: string, otp: string, role: Role) => Promise<void>;
  sendOtp: (phone: string) => Promise<string>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = {
    accessToken,
    refreshToken,
    user,
    async sendOtp(phone: string) {
      const response = await requestOtp(phone);
      return response.otp;
    },
    async login(phone: string, otp: string, role: Role) {
      const response = await verifyOtp(phone, otp, role);
      setAccessToken(response.access);
      setRefreshToken(response.refresh);
      setUser(response.user);
    },
    logout() {
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
