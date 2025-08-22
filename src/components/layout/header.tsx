"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, LogOut, Package, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import React from "react";
import { PasswordDialog } from "./password-dialog";


export function Header() {
  const { user, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);

  const handleLogout = () => {
    auth.signOut();
  };
  
  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  const handlePasswordSuccess = (path: 'sonhos' | 'apostas') => {
    setIsPasswordDialogOpen(false);
    router.push(`/${path}`);
  };

  return (
    <>
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <Package className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold">ProductDash</span>
            </Link>
          
           <div className="flex items-center gap-4">
             {user && isSuperAdmin && (
                <Button variant="ghost" size="icon" onClick={() => setIsPasswordDialogOpen(true)}>
                  <Lock className="h-5 w-5 text-muted-foreground"/>
                  <span className="sr-only">Acesso Secreto</span>
                </Button>
            )}

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
     <PasswordDialog 
        isOpen={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
        onSuccess={handlePasswordSuccess}
    />
    </>
  );
}
