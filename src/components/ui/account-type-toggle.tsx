"use client";

import { useState } from "react";
import { useAccountTypeContext } from "@/contexts/account-type-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export type AccountType = 'personal' | 'business';

interface AccountTypeToggleProps {
  currentType: AccountType;
  onTypeChange: (type: AccountType) => void;
  className?: string;
  disabled?: boolean;
  mobileInline?: boolean; // quando true, mostra controle inline também em mobile
}

export function AccountTypeToggle({ 
  currentType, 
  onTypeChange, 
  className,
  disabled = false,
  mobileInline = false,
}: AccountTypeToggleProps) {
  const { toast } = useToast();

  const handleToggle = () => {
    if (disabled) return;
    
    const newType: AccountType = currentType === 'personal' ? 'business' : 'personal';
    onTypeChange(newType);
    
    toast({
      title: `Modo ${newType === 'personal' ? 'Pessoal' : 'Empresarial'} ativado`,
      description: `Dashboard alterado para visualização ${newType === 'personal' ? 'pessoal' : 'empresarial'}`,
      duration: 2000,
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Desktop Toggle */}
      <div className="hidden sm:flex items-center gap-2 bg-muted rounded-lg p-1">
        <Button
          variant={currentType === 'personal' ? 'default' : 'ghost'}
          size="sm"
          className="gap-2"
          onClick={() => !disabled && onTypeChange('personal')}
          disabled={disabled}
        >
          <User className="h-4 w-4" />
          <span>Pessoal</span>
        </Button>
        <Button
          variant={currentType === 'business' ? 'default' : 'ghost'}
          size="sm"
          className="gap-2"
          onClick={() => !disabled && onTypeChange('business')}
          disabled={disabled}
        >
          <Building className="h-4 w-4" />
          <span>Empresarial</span>
        </Button>
      </div>

      {/* Mobile Toggle: inline no header quando mobileInline, senão flutuante */}
      {mobileInline ? (
        <div className="sm:hidden flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={currentType === 'personal' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => !disabled && onTypeChange('personal')}
            disabled={disabled}
            aria-label="Pessoal"
          >
            <User className="h-4 w-4" />
            <span className="sr-only">Pessoal</span>
          </Button>
          <Button
            variant={currentType === 'business' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => !disabled && onTypeChange('business')}
            disabled={disabled}
            aria-label="Empresarial"
          >
            <Building className="h-4 w-4" />
            <span className="sr-only">Empresarial</span>
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-4 right-4 z-30 sm:hidden">
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full shadow-xl border-2 border-white/20 transition-all duration-300 hover:scale-110 active:scale-95 relative overflow-hidden",
              currentType === 'personal'
                ? "bg-gradient-to-r from-purple-500 via-purple-600 to-blue-600 shadow-purple-500/25"
                : "bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 shadow-blue-500/25"
            )}
            onClick={handleToggle}
            disabled={disabled}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full" />
            
            {/* Icon */}
            <div className="relative z-10 text-white">
              {currentType === 'personal' ? (
                <User className="h-6 w-6" />
              ) : (
                <Building className="h-6 w-6" />
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Current Type Badge */}
      <Badge 
        variant="secondary" 
        className={cn(
          "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          currentType === 'personal' 
            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        )}
      >
        {currentType === 'personal' ? (
          <>
            <User className="h-3 w-3" />
            <span>Pessoal</span>
          </>
        ) : (
          <>
            <Building className="h-3 w-3" />
            <span>Empresarial</span>
          </>
        )}
      </Badge>
    </div>
  );
}

// Hook personalizado para gerenciar o tipo de conta
export function useAccountType(initialType: AccountType = 'business') {
  // Prefer global context when available
  const AccountTypeCtx = useAccountTypeContext();
  if (AccountTypeCtx) return AccountTypeCtx;

  // Fallback to local state if provider is not present
  const [accountType, setAccountType] = useState<AccountType>(initialType);

  const toggleAccountType = () => {
    setAccountType(prev => prev === 'personal' ? 'business' : 'personal');
  };

  const setAccountTypeWithCallback = (type: AccountType, callback?: (type: AccountType) => void) => {
    setAccountType(type);
    if (callback) callback(type);
  };

  return {
    accountType,
    setAccountType: setAccountTypeWithCallback,
    toggleAccountType,
    isPersonal: accountType === 'personal',
    isBusiness: accountType === 'business'
  };
}