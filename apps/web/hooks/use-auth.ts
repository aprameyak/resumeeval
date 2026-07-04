"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth, updateUser } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success("Welcome back!");
      router.push("/");
    },
    onError: () => {
      toast.error("Invalid email or password");
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      toast.success("Account created!");
      router.push("/");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || "Registration failed";
      toast.error(msg);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      qc.clear();
      router.push("/login");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      toast.success("Profile updated");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginPending: loginMutation.isPending,
    register: registerMutation.mutate,
    registerPending: registerMutation.isPending,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
  };
}
