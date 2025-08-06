import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type SummaryCardProps = {
    title: string;
    value: number;
    icon: LucideIcon;
    isCurrency?: boolean;
    className?: string;
}

export function SummaryCard({ title, value, icon: Icon, isCurrency = false, className }: SummaryCardProps) {
    
    const formattedValue = isCurrency
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : value.toString();
    
    return (
        <Card className={cn("flex flex-col justify-between", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {formattedValue}
                </div>
            </CardContent>
        </Card>
    )
}
