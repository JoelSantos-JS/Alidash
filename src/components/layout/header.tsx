import { Button } from "@/components/ui/button";
import { Lock, Package } from "lucide-react";

type HeaderProps = {
  onSecretClick?: () => void;
}

export function Header({ onSecretClick }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">ProductDash</span>
          </div>
          {onSecretClick && (
              <Button variant="ghost" size="icon" onClick={onSecretClick}>
                <Lock className="h-5 w-5 text-muted-foreground"/>
                <span className="sr-only">Acesso Secreto</span>
              </Button>
          )}
        </div>
      </div>
    </header>
  );
}