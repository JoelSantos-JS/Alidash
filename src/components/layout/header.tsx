import { Package } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">AliInsights</span>
          </div>
        </div>
      </div>
    </header>
  );
}
