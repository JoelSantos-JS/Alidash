"use client";

import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, ShieldCheck, Calendar, LogOut, Zap } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
    const { user, isPro, proSubscription, openUpgradeModal } = useAuth();

    const handleLogout = () => {
        auth.signOut();
    };

    const planName = proSubscription?.plan === 'lifetime' ? 'Vitalício' 
                   : proSubscription?.plan === 'monthly' ? 'Mensal' 
                   : proSubscription?.plan === 'biweekly' ? 'Quinzenal' : 'N/A';

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <User className="w-10 h-10 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold">Meu Perfil</h1>
                            <p className="text-muted-foreground">Gerencie suas informações e sua assinatura.</p>
                        </div>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Conta</CardTitle>
                            <CardDescription>Estes são os detalhes da sua conta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-muted-foreground">Email</span>
                                <span className="font-mono text-sm">{user?.email}</span>
                            </div>
                            <Separator />
                             <div className="flex justify-between items-center">
                                <span className="font-medium text-muted-foreground">Plano Atual</span>
                                {isPro ? (
                                    <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1.5 border-transparent">
                                        <ShieldCheck className="w-4 h-4"/> Pro
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">Gratuito</Badge>
                                )}
                            </div>
                            {isPro && proSubscription && (
                                <>
                                 <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-muted-foreground">Tipo de Plano</span>
                                    <span className="capitalize">{planName}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-muted-foreground">Acesso até</span>
                                     <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-muted-foreground"/>
                                        {proSubscription.expiresAt.toDate().toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col items-start gap-4">
                            {!isPro && (
                                <Button onClick={openUpgradeModal} className="w-full">
                                    <Zap className="mr-2 h-4 w-4"/> Fazer Upgrade para o Pro
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleLogout} className="w-full">
                                <LogOut className="mr-2 h-4 w-4"/> Sair da Conta
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </main>
        </div>
    );
}
