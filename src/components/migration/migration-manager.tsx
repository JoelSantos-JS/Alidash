"use client"

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Package, 
  Target, 
  TrendingUp,
  Loader2,
  PlayCircle,
  StopCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface MigrationResult {
  success: boolean
  migratedUsers: number
  migratedProducts: number
  migratedDreams: number
  migratedBets: number
  migratedGoals: number
  migratedTransactions: number
  errors: string[]
}

interface MigrationProgress {
  phase: string
  current: number
  total: number
  status: 'pending' | 'running' | 'completed' | 'error'
  message: string
}

export function MigrationManager() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null)
  const [singleUserUid, setSingleUserUid] = useState('')
  const [migrationActive, setMigrationActive] = useState(false)

  const startMigration = async (type: 'all' | 'single') => {
    if (type === 'single' && !singleUserUid.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira o UID do usuário Firebase.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    setMigrationActive(true)
    setMigrationResult(null)
    setMigrationProgress({
      phase: 'Iniciando migração...',
      current: 0,
      total: 100,
      status: 'pending',
      message: 'Preparando sistema para migração'
    })

    try {
      const response = await fetch('/api/migration/firebase-to-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          firebaseUid: type === 'single' ? singleUserUid.trim() : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na migração')
      }

      setMigrationResult(data.migration)
      setMigrationProgress({
        phase: 'Migração concluída',
        current: 100,
        total: 100,
        status: 'completed',
        message: `Migração ${type} concluída com sucesso`
      })

      toast({
        title: 'Migração Concluída',
        description: `${data.migration.migratedUsers} usuários migrados com sucesso.`
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setMigrationProgress({
        phase: 'Erro na migração',
        current: 0,
        total: 100,
        status: 'error',
        message: errorMessage
      })

      toast({
        title: 'Erro na Migração',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setMigrationActive(false)
    }
  }

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch('/api/migration/firebase-to-supabase?check=true')
      const data = await response.json()

      toast({
        title: 'Status da Migração',
        description: data.message
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível verificar o status da migração.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          Migração Firebase → Supabase
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Gerencie a migração de dados do Firebase para Supabase
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Firebase</span>
                <Badge variant="secondary">Origem</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Banco de dados atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Supabase</span>
                <Badge variant="default">Destino</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Novo banco de dados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {migrationActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">Status</span>
                <Badge variant={migrationActive ? "default" : "outline"}>
                  {migrationActive ? 'Em Migração' : 'Pronto'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estado do sistema
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progresso da Migração */}
        {migrationProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progresso da Migração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{migrationProgress.phase}</span>
                  <span>{migrationProgress.current}% / {migrationProgress.total}%</span>
                </div>
                <Progress value={migrationProgress.current} className="w-full" />
              </div>
              
              <div className="flex items-center gap-2">
                {migrationProgress.status === 'running' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {migrationProgress.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {migrationProgress.status === 'error' && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">{migrationProgress.message}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados da Migração */}
        {migrationResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resultados da Migração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{migrationResult.migratedUsers}</div>
                    <div className="text-xs text-muted-foreground">Usuários</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">{migrationResult.migratedProducts}</div>
                    <div className="text-xs text-muted-foreground">Produtos</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">{migrationResult.migratedDreams}</div>
                    <div className="text-xs text-muted-foreground">Sonhos</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium">{migrationResult.migratedBets}</div>
                    <div className="text-xs text-muted-foreground">Apostas</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-500" />
                  <div>
                    <div className="font-medium">{migrationResult.migratedGoals}</div>
                    <div className="text-xs text-muted-foreground">Metas</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-indigo-500" />
                  <div>
                    <div className="font-medium">{migrationResult.migratedTransactions}</div>
                    <div className="text-xs text-muted-foreground">Transações</div>
                  </div>
                </div>
              </div>

              {migrationResult.errors.length > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">
                      {migrationResult.errors.length} erro(s) durante a migração:
                    </div>
                    <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
                      {migrationResult.errors.map((error, index) => (
                        <li key={index} className="text-red-600">• {error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Controles de Migração */}
        <Tabs defaultValue="complete" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="complete">Migração Completa</TabsTrigger>
            <TabsTrigger value="single">Usuário Específico</TabsTrigger>
          </TabsList>

          <TabsContent value="complete" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Esta operação migrará todos os usuários e dados do Firebase para o Supabase. 
                Esta operação pode demorar vários minutos dependendo da quantidade de dados.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={() => startMigration('all')} 
                disabled={isLoading || migrationActive}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Iniciar Migração Completa
              </Button>

              <Button 
                variant="outline" 
                onClick={checkMigrationStatus}
                disabled={isLoading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="single" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firebase-uid">UID do Usuário Firebase</Label>
              <Input
                id="firebase-uid"
                value={singleUserUid}
                onChange={(e) => setSingleUserUid(e.target.value)}
                placeholder="Digite o UID do usuário Firebase"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Migre apenas um usuário específico usando seu UID do Firebase.
              </p>
            </div>

            <Button 
              onClick={() => startMigration('single')} 
              disabled={isLoading || migrationActive || !singleUserUid.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Migrar Usuário
            </Button>
          </TabsContent>
        </Tabs>

        {/* Avisos e Informações */}
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Informações Importantes:</div>
              <ul className="text-xs space-y-1">
                <li>• A migração mantém a compatibilidade com o sistema atual</li>
                <li>• Os dados do Firebase não são removidos durante o processo</li>
                <li>• O sistema pode continuar funcionando durante a migração</li>
                <li>• Após a migração, configure o sistema para usar o Supabase como primário</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}