"use client"

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  Home,
  Package,
  CreditCard,
  TrendingUp,
  Target,
  PiggyBank,
  Receipt,
  BarChart3,
  Calendar,
  Settings,
  User,
  Heart,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
    description: "Visão geral"
  },
  {
    href: "/produtos",
    label: "Produtos",
    icon: Package,
    description: "Gestão de produtos"
  },
  {
    href: "/transacoes",
    label: "Transações",
    icon: CreditCard,
    description: "Histórico financeiro"
  },
  {
    href: "/receitas",
    label: "Receitas",
    icon: TrendingUp,
    description: "Entradas"
  },
  {
    href: "/despesas",
    label: "Despesas",
    icon: Receipt,
    description: "Saídas"
  },
  {
    href: "/dividas",
    label: "Dívidas",
    icon: PiggyBank,
    description: "Controle de dívidas"
  },
  {
    href: "/metas",
    label: "Metas",
    icon: Target,
    description: "Objetivos financeiros"
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    description: "Análises"
  },
  {
    href: "/agenda",
    label: "Agenda",
    icon: Calendar,
    description: "Compromissos"
  },
  {
    href: "/categorias",
    label: "Categorias",
    icon: Settings,
    description: "Organização"
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: User,
    description: "Configurações pessoais"
  },
  {
    href: "/apostas",
    label: "Apostas",
    icon: Gamepad2,
    description: "Gestão de apostas"
  }
];

interface ResponsiveNavigationProps {
  className?: string;
  showLabels?: boolean;
  maxVisibleItems?: number;
}

export function ResponsiveNavigation({ 
  className, 
  showLabels = true,
  maxVisibleItems = 8 
}: ResponsiveNavigationProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar se pode fazer scroll
  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  // Função para fazer scroll
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  // Dividir itens em visíveis e overflow
  const visibleItems = navigationItems.slice(0, maxVisibleItems);
  const overflowItems = navigationItems.slice(maxVisibleItems);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex items-center gap-1">
        {/* Botão de scroll esquerda */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 p-0 bg-background shadow-sm hover:bg-accent"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Container das tabs com scroll */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="w-full" ref={scrollRef}>
            <div className="flex items-center gap-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "flex-shrink-0 gap-1.5 h-8 px-2.5 transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        active && "bg-primary text-primary-foreground shadow-sm",
                        !showLabels && "w-8 px-0",
                        // Responsivo
                        "text-xs md:text-sm md:h-10 md:px-4 md:gap-2",
                        "min-w-max"
                      )}
                      title={item.description}
                    >
                      <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                      {showLabels && (
                        <span className="whitespace-nowrap text-xs md:text-sm md:font-medium">
                          {item.label}
                        </span>
                      )}
                      {item.badge && (
                        <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs">
                          {item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5 mt-1" />
          </ScrollArea>
        </div>

        {/* Botão de scroll direita */}
        {canScrollRight && (
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 p-0 bg-background shadow-sm hover:bg-accent"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Menu overflow para itens extras */}
        {overflowItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10 p-0 bg-background shadow-sm hover:bg-accent ml-1"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {overflowItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center w-full">
                      <Icon className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}