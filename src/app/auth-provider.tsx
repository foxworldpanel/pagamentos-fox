"use client";

import { AuthProvider as SupabaseAuthProvider } from "@/lib/auth-context";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
} 