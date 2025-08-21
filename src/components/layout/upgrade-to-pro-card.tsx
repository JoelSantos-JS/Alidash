"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Zap } from "lucide-react";

interface UpgradeToProCardProps {
    title: string;
    description: string;
    onUpgradeClick: () => void;
}

export function UpgradeToProCard({ title, description, onUpgradeClick }: UpgradeToProCardProps) {
    return (
        <Card className="w-full max-w-md mx-auto text-center shadow-lg border-2 border-primary/50 bg-gradient-to-br from-card to-primary/10">
            <CardHeader>
                <div className="mx-auto bg-primary/20 p-3 rounded-full mb-4">
                    <Star className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <CardDescription className="text-base text-muted-foreground pt-2">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button size="lg" className="w-full shadow-lg" onClick={onUpgradeClick}>
                    <Zap className="mr-2 h-5 w-5" />
                    Fazer Upgrade para o Pro
                </Button>
            </CardContent>
        </Card>
    )
}
