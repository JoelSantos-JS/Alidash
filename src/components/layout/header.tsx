"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, LogOut, Package } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { usePathname } from "next/navigation";

type HeaderProps = {
  onSecretClick?: () => void;
}

export function Header({ onSecretClick }: HeaderProps) {
  const { user, isSuperAdmin } = useAuth();
  const pathname = usePathname();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <Package className="h-7 w-7 text-primary" />
                <span className="text-xl font-bold">ProductDash</span>
            </Link>
          
           <div className="flex items-center gap-4">
             {user && onSecretClick && isSuperAdmin && (
                <Button variant="ghost" size="icon" onClick={onSecretClick}>
                  <Lock className="h-5 w-5 text-muted-foreground"/>
                  <span className="sr-only">Acesso Secreto</span>
                </Button>
            )}

            {user && pathname !== '/' && (
               <Button asChild variant="outline">
                  <Link href="/">Dashboard</Link>
               </Button>
            )}

             {user && (
                <Button variant="destructive" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5"/>
                  <span className="sr-only">Sair</span>
                </Button>
            )}
           </div>
        </div>
      </div>
    </header>
  );
}
