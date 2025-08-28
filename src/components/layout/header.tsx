"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Package, User as UserIcon, LogOut, LayoutDashboard, KeyRound, BarChart, Menu, Settings, CreditCard } from "lucide-react";
import { AccountTypeToggle } from "@/components/ui/account-type-toggle";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function Header() {
  const { user, logoutWithBackup, accountType, setAccountType } = useAuth();

  const handleLogout = async () => {
    await logoutWithBackup();
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <Logo size="lg" />
                <span className="text-xl font-bold">Zeromize</span>
            </Link>
            
            {/* Account Type Toggle */}
            <AccountTypeToggle 
              value={accountType} 
              onValueChange={setAccountType}
            />
          
            <div className="flex items-center gap-4">
            {/* Menu de Navegação dos Dashboards - Apenas para joeltere9@gmail.com */}
            {user && user?.email === 'joeltere9@gmail.com' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboards</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Navegação</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center w-full">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Dashboard de Produtos</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sonhos" className="flex items-center w-full">
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Dashboard de Sonhos</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/apostas" className="flex items-center w-full">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Dashboard de Apostas</span>
                    </Link>
                  </DropdownMenuItem>


                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Menu do Usuário */}
            {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL || ''} alt={user.email || ''} />
                          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                     <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">Minha Conta</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                       <DropdownMenuItem asChild>
                          <Link href="/perfil" className="flex items-center w-full">
                              <UserIcon className="mr-2 h-4 w-4" />
                              <span>Perfil</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                          <Link href="/perfil?tab=settings" className="flex items-center w-full">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Configurações</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                         <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            )}
           </div>
        </div>
      </div>
    </header>
  );
}
