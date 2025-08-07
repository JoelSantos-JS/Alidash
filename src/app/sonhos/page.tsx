"use client";

import { Header } from "@/components/layout/header";
import { KeyRound } from "lucide-react";

export default function DreamsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <KeyRound className="w-8 h-8 text-primary" />
              Dashboard de Sonhos
            </h2>
            <p className="text-muted-foreground">
              Planeje, acompanhe e conquiste seus maiores objetivos.
            </p>
          </div>
        </div>
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-medium">Em breve...</h3>
            <p className="text-muted-foreground">
              Aqui você poderá adicionar e acompanhar a projeção dos seus sonhos.
            </p>
        </div>
      </main>
    </div>
  );
}