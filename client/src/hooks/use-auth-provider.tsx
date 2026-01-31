import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AuthResponse, type LoginRequest, type RegisterRequest } from "@shared/routes";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

type User = AuthResponse['user'];

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => void;
  register: (data: RegisterRequest) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Fetch user if token exists
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch(api.auth.me.path, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        setToken(null);
        localStorage.removeItem('token');
        return null;
      }
      if (!res.ok) throw new Error('Failed to fetch user');
      return await res.json();
    },
    enabled: !!token,
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Login failed');
      }
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      setLocation('/');
    },
    onError: (err) => {
      toast({ 
        title: "Login failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await fetch(api.auth.register.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Registration failed');
      }
      return await res.json() as AuthResponse;
    },
    onSuccess: (data) => {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      queryClient.setQueryData(['/api/auth/me'], data.user);
      toast({ title: "Account created!", description: "Welcome to your new portfolio." });
      setLocation('/');
    },
    onError: (err) => {
      toast({ 
        title: "Registration failed", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  });

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    queryClient.setQueryData(['/api/auth/me'], null);
    queryClient.clear();
    setLocation('/login');
    toast({ title: "Logged out", description: "See you next time." });
  };

  return (
    <AuthContext.Provider value={{
      user: user || null,
      token,
      isLoading,
      login: loginMutation.mutate,
      register: registerMutation.mutate,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
