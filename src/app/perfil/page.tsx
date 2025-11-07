"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-supabase-auth";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  LogOut, 
  Settings,
  Globe,
  Package,
  KeyRound,
  BarChart
} from "lucide-react";

import { BackupStatusCard } from "@/components/layout/backup-status-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { backupUserData } from "@/lib/backup-client";
import NotificationSettings from "@/components/notifications/notification-settings";

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'account';
    
    // Estados para configurações
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupInterval, setBackupInterval] = useState<NodeJS.Timeout | null>(null);
    
    // Estado para dados do usuário
    const [userData, setUserData] = useState<any>(null);
    const [userName, setUserName] = useState('');
    const [isUpdatingName, setIsUpdatingName] = useState(false);
    const [isLoadingUserData, setIsLoadingUserData] = useState(false);

    // Função para buscar dados do usuário
    const fetchUserData = async () => {
        if (!user?.id) return;
        
        setIsLoadingUserData(true);
        try {
            const response = await fetch('/api/user/get', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id
                })
            });

            if (response.ok) {
                const result = await response.json();
                setUserData(result.user);
                setUserName(result.user.name || user.email?.split('@')[0] || '');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
        } finally {
            setIsLoadingUserData(false);
        }
    };

    // Carregar dados do usuário quando disponível
    useEffect(() => {
        fetchUserData();
    }, [user?.id]);

    // Função para atualizar o nome do usuário
    const updateUserName = async () => {
        if (!user?.id || !userName.trim()) {
            toast({
                title: "Erro",
                description: "Nome não pode estar vazio.",
                variant: "destructive",
                duration: 3000,
            });
            return;
        }

        if (userName.trim() === userData?.name) {
            toast({
                title: "Informação",
                description: "O nome não foi alterado.",
                duration: 2000,
            });
            return;
        }

        setIsUpdatingName(true);

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    name: userName.trim()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao atualizar nome');
            }

            const result = await response.json();
            
            // Atualizar dados locais
            await fetchUserData();
            
            toast({
                title: "Nome Atualizado",
                description: "Seu nome foi atualizado com sucesso!",
                duration: 3000,
            });

            console.log('Nome atualizado com sucesso:', result.user);

        } catch (error: any) {
            console.error('Erro ao atualizar nome:', error);
            toast({
                title: "Erro ao Atualizar Nome",
                description: error.message || "Houve um problema ao atualizar seu nome.",
                variant: "destructive",
                duration: 3000,
            });
        } finally {
            setIsUpdatingName(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    // Função para executar backup automático
    const performAutoBackup = async () => {
        if (!user || !autoBackup) return;
        
        try {
            console.log('🔄 Executando backup automático...');
            await backupUserData(user);
            console.log('✅ Backup automático concluído');
            
            toast({
                title: "Backup Automático Concluído",
                description: "Seus dados foram salvos com sucesso.",
                duration: 2000,
            });
        } catch (error: any) {
            console.error('❌ Erro no backup automático:', error);
            toast({
                title: "Erro no Backup Automático",
                description: "Houve um problema ao fazer o backup. Tente novamente.",
                variant: "destructive",
                duration: 3000,
            });
        }
    };

    // Função para ativar/desativar backup automático
    const toggleAutoBackup = (enabled: boolean) => {
        setAutoBackup(enabled);
        
        if (enabled) {
            toast({
                title: "Backup Automático Ativado",
                description: "O backup será executado automaticamente a cada 30 minutos.",
                duration: 3000,
            });
            console.log('Backup automático ativado');
        } else {
            toast({
                title: "Backup Automático Desativado",
                description: "O backup automático foi desabilitado.",
                duration: 3000,
            });
            console.log('Backup automático desativado');
            if (backupInterval) {
                clearInterval(backupInterval);
                setBackupInterval(null);
            }
        }
    };

    // Configurar intervalo de backup automático
    useEffect(() => {
        if (autoBackup && user) {
            // Backup a cada 30 minutos (1800000 ms)
            const interval = setInterval(performAutoBackup, 30 * 60 * 1000);
            setBackupInterval(interval);
            
            return () => {
                if (interval) {
                    clearInterval(interval);
                }
            };
        } else if (backupInterval) {
            clearInterval(backupInterval);
            setBackupInterval(null);
        }
    }, [autoBackup, user]);

    // Limpar intervalo ao desmontar componente
    useEffect(() => {
        return () => {
            if (backupInterval) {
                clearInterval(backupInterval);
            }
        };
    }, []);

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
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Input 
                                                    id="name" 
                                                    placeholder="Seu nome completo"
                                                    value={userName}
                                                    onChange={(e) => setUserName(e.target.value)}
                                                    disabled={isUpdatingName}
                                                    className="flex-1"
                                                />
                                                <Button 
                                                    onClick={updateUserName}
                                                    disabled={isUpdatingName || !userName.trim() || userName.trim() === userData?.name}
                                                    size="sm"
                                                    className="w-full sm:w-auto min-w-[80px]"
                                                >
                                                    {isUpdatingName ? "Salvando..." : "Salvar"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Plano Atual</span>
                                            <Badge variant="secondary">Gratuito</Badge>
                                        </div>
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
                                                        <Link href="/apostas">
                                                            <BarChart className="mr-2 h-4 w-4" />
                                                            Dashboard de Apostas
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
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
                                                <Label>Tema da Aplicação</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Modo escuro ativo permanentemente
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">Modo Escuro</Badge>
                                                <ThemeToggle />
                                            </div>
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Notificações por Email</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receber notificações importantes por email
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={emailNotifications}
                                                onCheckedChange={setEmailNotifications}
                                            />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Backup Automático</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Fazer backup automático dos dados a cada 30 minutos
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={autoBackup}
                                                onCheckedChange={toggleAutoBackup}
                                            />
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
                            <NotificationSettings />
                        </TabsContent>


                    </Tabs>
                </div>
            </main>
        </div>
    );
}
