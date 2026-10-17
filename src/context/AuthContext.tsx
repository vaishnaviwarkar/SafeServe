import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { User, UserRole } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: any) => Promise<{ success: boolean; message?: string }>;
  switchRole: (role: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isVerified: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("safeserve_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("safeserve_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile from backend on launch
  useEffect(() => {
    if (token) {
      refreshProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data && res.data.user) {
        setUser(res.data.user);
        localStorage.setItem("safeserve_user", JSON.stringify(res.data.user));
      }
    } catch (err: any) {
      // If error is 401 or 403, logout
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logout();
      }
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.post("/auth/login", { email, password: pass });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem("safeserve_token", jwtToken);
      localStorage.setItem("safeserve_user", JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid credentials or account access restricted."
      };
    }
  };

  const adminLogin = async (email: string, pass: string) => {
    try {
      const res = await api.post("/auth/admin/login", { email, password: pass });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem("safeserve_token", jwtToken);
      localStorage.setItem("safeserve_user", JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Administrator authentication failed."
      };
    }
  };

  const registerUser = async (data: any) => {
    try {
      const res = await api.post("/auth/register", data);
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem("safeserve_token", jwtToken);
      localStorage.setItem("safeserve_user", JSON.stringify(userData));
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed."
      };
    }
  };

  const switchRole = async (role: UserRole) => {
    try {
      const res = await api.post("/auth/switch-role", { role });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      localStorage.setItem("safeserve_token", jwtToken);
      localStorage.setItem("safeserve_user", JSON.stringify(userData));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to switch role."
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("safeserve_token");
    localStorage.removeItem("safeserve_user");
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    // Hard redirect to prevent back-button cache replay
    window.location.href = "/";
  };

  const isAuthenticated = !!token && !!user;
  const isVerified = user?.status === "VERIFIED" || user?.role === "ADMIN";

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        adminLogin,
        registerUser,
        switchRole,
        logout,
        refreshProfile,
        isAuthenticated,
        isVerified,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
