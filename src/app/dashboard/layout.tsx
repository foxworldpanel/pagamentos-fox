"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideLayoutDashboard, LucideLink, LucideArrowRightLeft, LucideLogOut, LucideMenu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

// Componentes do Sidebar
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="w-full flex min-h-screen bg-[#1d1d1d] text-white">
        <Sidebar className="bg-[#252525] border-r border-[#333333] shadow-lg">
          <SidebarHeader className="p-6 border-b border-[#333333] bg-[#252525] flex justify-center items-center">
            <div className="flex flex-col items-center">
              {/* Você pode adicionar um logo aqui */}
              <div className="font-bold text-xl text-[#0ae339]">Fox World Panel</div>
              <div className="text-xs text-gray-400 mt-1">Sistema de Pagamentos</div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="bg-[#252525] py-4">
            <SidebarGroup>
              <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Menu Principal
              </div>
              <SidebarMenu className="px-2">
                <MenuItem 
                  href="/dashboard" 
                  icon={<LucideLayoutDashboard className="h-5 w-5" />} 
                  title="Dashboard"
                  isActive={pathname === "/dashboard"}
                  className="hover:bg-[#333333] hover:text-[#0ae339]"
                />
                
                <MenuItem 
                  href="/dashboard/criar-link" 
                  icon={<LucideLink className="h-5 w-5" />} 
                  title="Criar Pagamento"
                  isActive={pathname === "/dashboard/criar-link"}
                  className="hover:bg-[#333333] hover:text-[#0ae339]"
                />
                
                <MenuItem 
                  href="/dashboard/pagamentos" 
                  icon={<LucideArrowRightLeft className="h-5 w-5" />} 
                  title="Pagamentos"
                  isActive={pathname === "/dashboard/pagamentos"}
                  className="hover:bg-[#333333] hover:text-[#0ae339]"
                />
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="p-4 border-t border-[#333333] bg-[#252525]">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 px-4 py-3 rounded-md bg-[#2a2a2a]">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#333333] text-[#0ae339]">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium truncate">
                    {user?.email}
                  </div>
                  <div className="text-xs text-gray-400">
                    Conectado
                  </div>
                </div>
              </div>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 w-full px-4 py-3 rounded-md border border-[#333333] text-white bg-[#2a2a2a] hover:bg-[#333333] transition-colors duration-200"
              >
                <LucideLogOut className="h-5 w-5" />
                <span>Sair</span>
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6 flex items-center">
            <SidebarTrigger className="md:hidden mr-4">
              <LucideMenu className="h-6 w-6" />
            </SidebarTrigger>
            <div className="flex-1" />
          </div>
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}

// Componente de item de menu reutilizável
function MenuItem({ 
  href, 
  icon, 
  title, 
  isActive,
  className
}: { 
  href: string; 
  icon: React.ReactNode; 
  title: string; 
  isActive: boolean;
  className?: string;
}) {
  return (
    <SidebarMenuButton
      isActive={isActive}
      tooltip={title}
      asChild
      className={`mb-1 transition-all duration-200 ${className}`}
    >
      <Link 
        href={href} 
        className={`
          flex items-center space-x-3 px-4 py-3 rounded-md 
          ${isActive 
            ? 'bg-[#333333] text-[#0ae339] font-medium shadow-sm' 
            : 'hover:bg-[#2a2a2a] text-gray-300 hover:text-white'
          }
        `}
      >
        <div className={isActive ? 'text-[#0ae339]' : 'text-gray-400'}>
          {icon}
        </div>
        <span>{title}</span>
        {isActive && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-[#0ae339] rounded-r-md" />
        )}
      </Link>
    </SidebarMenuButton>
  );
} 