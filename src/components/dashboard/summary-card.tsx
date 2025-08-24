
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SummaryCardProps = {
    title: string;
    value: number;
    icon: LucideIcon;
    isCurrency?: boolean;
    isPercentage?: boolean;
    className?: string;
}

export function SummaryCard({ title, value, icon: Icon, isCurrency = false, isPercentage = false, className }: SummaryCardProps) {
    
    const formattedValue = isCurrency
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : isPercentage
    ? `${value.toFixed(2)}%`
    : value.toString();
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground", className)} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-lg sm:text-xl md:text-2xl font-bold", className)}>
                    {formattedValue}
                </div>
            </CardContent>
        </Card>
    )
}

    