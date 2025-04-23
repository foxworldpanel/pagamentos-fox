"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  
  // Verificar se já existe uma sessão ativa no carregamento
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/dashboard");
      }
    };
    
    checkSession();
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Tenta fazer login com email/senha
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      console.error("Erro de login:", error);
      setError(error.message || "Falha na autenticação. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1d1d1d] text-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={180}
            height={50}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="text-2xl font-bold text-white">Acesse sua conta</h1>
          <p className="text-gray-400 mt-2">
            Insira suas credenciais para continuar
          </p>
        </div>
        
        <Card className="w-full shadow-sm bg-[#252525] border-[#333333] text-white">
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Senha</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#0ae339] hover:text-[#0ae339]/80"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 border-[#333333] bg-[#1d1d1d] text-white focus-visible:ring-[#0ae339]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-sm text-white">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit"
                className="w-full h-12 bg-[#0ae339] hover:bg-[#0ae339]/90 text-[#1d1d1d] font-medium mt-2"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Fox World Panel. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
} 