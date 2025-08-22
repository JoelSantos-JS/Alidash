"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { backupUserData, getBackupStatus } from "@/lib/backup-client";

export function BackupStatusCard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [itemCounts, setItemCounts] = useState<{products: number, dreams: number, bets: number} | null>(null);

  // Carregar status do backup ao montar o componente
  useEffect(() => {
    const loadBackupStatus = async () => {
      if (!user) return;
      
      try {
        const status = await getBackupStatus(user.uid);
        if (status.exists) {
          setLastBackup(status.lastSync);
          setItemCounts(status.itemCounts);
        }
      } catch (error) {
        console.error('Erro ao carregar status do backup:', error);
      }
    };

    loadBackupStatus();
  }, [user]);

  const handleBackupNow = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const backupData = await backupUserData(user);
      
      setLastBackup(backupData.lastSync.toISOString());
      setItemCounts({
        products: backupData.products?.length || 0,
        dreams: backupData.dreams?.length || 0,
        bets: backupData.bets?.length || 0
      });
      toast({
        title: "Backup realizado!",
        description: `${backupData.products?.length || 0} produtos, ${backupData.dreams?.length || 0} sonhos e ${backupData.bets?.length || 0} apostas salvos.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro no backup",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Backup de Segurança
        </CardTitle>
        <CardDescription>
          Mantenha seus dados seguros com backup automático em nuvem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Status:</span>
          </div>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Ativo
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Último backup:</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatDate(lastBackup)}
          </span>
        </div>

        <Button 
          onClick={handleBackupNow} 
          disabled={isLoading}
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Fazendo backup...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Fazer Backup Agora
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <AlertTriangle className="inline h-3 w-3 mr-1" />
          Em caso de problemas técnicos, seus dados podem ser restaurados do backup.
        </div>
      </CardContent>
    </Card>
  );
} 