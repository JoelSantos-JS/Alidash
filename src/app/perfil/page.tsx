"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  ShieldCheck, 
  Calendar, 
  LogOut, 
  Zap, 
  Settings,
  Bell,
  Palette,
  Globe,
  Download,
  Upload,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Package,
  KeyRound,
  BarChart
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { BackupStatusCard } from "@/components/layout/backup-status-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
    const { user, isPro, proSubscription, openUpgradeModal, logoutWithBackup } = useAuth();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'account';

    const handleLogout = async () => {
        await logoutWithBackup();
    };

    const planName = proSubscription?.plan === 'lifetime' ? 'Vitalício' 
                   : proSubscription?.plan === 'monthly' ? 'Mensal' 
                   : proSubscription?.plan === 'biweekly' ? 'Quinzenal' : 'N/A';

    const getInitials = (email: string | null | undefined) => {
        if (!email) return 'U';
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-lg">
                                {getInitials(user?.email)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">Meu Perfil</h1>
                                <p className="text-muted-foreground">Gerencie suas informações e configurações.</p>
                            </div>
                        </div>
                        <ThemeToggle />
                    </div>
                    
                    <Tabs defaultValue={defaultTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="account">Conta</TabsTrigger>
                            <TabsTrigger value="settings">Configurações</TabsTrigger>
                            <TabsTrigger value="notifications">Notificações</TabsTrigger>
                        </TabsList>

                        <TabsContent value="account" className="space-y-6">
                            {/* Informações da Conta */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        Informações da Conta
                                    </CardTitle>
                                    <CardDescription>Gerencie os detalhes da sua conta.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input 
                                                id="email" 
                                                value={user?.email || ''} 
                                                disabled 
                                                className="bg-muted"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome Completo</Label>
                                            <Input 
                                                id="name" 
                                                placeholder="Seu nome completo"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input 
                                                id="phone" 
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Localização</Label>
                                            <Input 
                                                id="location" 
                                                placeholder="Cidade, Estado"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Biografia</Label>
                                        <Textarea 
                                            id="bio" 
                                            placeholder="Conte um pouco sobre você..."
                                            rows={3}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Plano Atual</span>
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
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Tipo de Plano</span>
                                                    <span className="capitalize">{planName}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Acesso até</span>
                                                    <span className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-muted-foreground"/>
                                                        {proSubscription.expiresAt.toDate().toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-col items-start gap-4">
                                    {/* Navegação Rápida para Dashboards - Apenas para joeltere9@gmail.com */}
                                    {user?.email === 'joeltere9@gmail.com' && (
                                        <>
                                            <Separator />
                                            <div className="w-full space-y-3">
                                                <h4 className="font-medium text-sm">Navegação Rápida</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <Button asChild variant="outline" size="sm" className="justify-start">
                                                        <Link href="/">
                                                            <Package className="mr-2 h-4 w-4" />
                                                            Dashboard de Produtos
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="outline" size="sm" className="justify-start">
                                                        <Link href="/sonhos">
                                                            <KeyRound className="mr-2 h-4 w-4" />
                                                            Dashboard de Sonhos
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="outline" size="sm" className="justify-start">
                                                        <Link href="/apostas">
                                                            <BarChart className="mr-2 h-4 w-4" />
                                                            Dashboard de Apostas
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
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

                            {/* Backup Status */}
                            <BackupStatusCard />
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Configurações Gerais
                                    </CardTitle>
                                    <CardDescription>Personalize sua experiência na aplicação.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Modo Escuro</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Alternar entre tema claro e escuro
                                                </p>
                                            </div>
                                            <ThemeToggle />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Notificações por Email</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receber notificações importantes por email
                                                </p>
                                            </div>
                                            <Switch />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Backup Automático</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Fazer backup automático dos dados
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Idioma</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Português (Brasil)
                                                </p>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <Globe className="w-4 h-4 mr-2" />
                                                Alterar
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="notifications" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="w-5 h-5" />
                                        Notificações
                                    </CardTitle>
                                    <CardDescription>Configure como você quer receber notificações.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Novos Produtos</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Notificar quando novos produtos forem adicionados
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Vendas Realizadas</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Notificar sobre vendas realizadas
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Estoque Baixo</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Alertar quando produtos estiverem com estoque baixo
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Relatórios Semanais</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Enviar relatórios semanais por email
                                                </p>
                                            </div>
                                            <Switch />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>


                    </Tabs>
                </div>
            </main>
        </div>
    );
}
