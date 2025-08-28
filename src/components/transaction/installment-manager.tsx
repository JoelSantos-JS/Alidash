"use client";

import { useState } from "react";
import { Plus, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallmentTransactionCard } from "./installment-transaction-card";
import { TransactionForm } from "./transaction-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isInstallmentTransaction } from "@/lib/utils";
import type { Transaction } from "@/types";

interface InstallmentManagerProps {
  transactions: Transaction[];
  onSaveTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function InstallmentManager({
  transactions,
  onSaveTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: InstallmentManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Filtrar transações parceladas
  const installmentTransactions = transactions.filter(isInstallmentTransaction);
  
  // Separar por status
  const pendingInstallments = installmentTransactions.filter(t => t.status === 'pending');
  const completedInstallments = installmentTransactions.filter(t => t.status === 'completed');
  
  // Calcular totais
  const totalInstallmentAmount = installmentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRemainingAmount = installmentTransactions
    .filter(t => t.installmentInfo)
    .reduce((sum, t) => sum + (t.installmentInfo?.remainingAmount || 0), 0);
  const totalPaidAmount = totalInstallmentAmount - totalRemainingAmount;

  const handleSave = (transaction: Transaction) => {
    if (editingTransaction) {
      onUpdateTransaction(transaction);
    } else {
      onSaveTransaction(transaction);
    }
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    onDeleteTransaction(id);
  };

  const getFilteredTransactions = () => {
    switch (activeTab) {
      case "pending":
        return pendingInstallments;
      case "completed":
        return completedInstallments;
      default:
        return installmentTransactions;
    }
  };

  // Se não há transações parceladas, mostrar mensagem
  if (installmentTransactions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Compras Parceladas no Cartão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Nenhuma compra parcelada encontrada
              </h3>
              <p className="text-gray-700 mb-6 font-medium">
                Você ainda não tem compras parceladas no cartão de crédito.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                Adicionar Primeira Compra Parcelada
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal do formulário */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Compra Parcelada</DialogTitle>
            </DialogHeader>
            <TransactionForm
              onSave={handleSave}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingTransaction(null);
              }}
              transactionToEdit={editingTransaction}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Total Parcelado</p>
                <p className="text-2xl font-bold text-red-700">
                  R$ {totalInstallmentAmount.toFixed(2)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Restante a Pagar</p>
                <p className="text-2xl font-bold text-orange-700">
                  R$ {totalRemainingAmount.toFixed(2)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Já Pago</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {totalPaidAmount.toFixed(2)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e lista de transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Compras Parceladas no Cartão
            </CardTitle>
            <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Compra Parcelada
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Todas ({installmentTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes ({pendingInstallments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Pagas ({completedInstallments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {getFilteredTransactions().length === 0 ? (
                <div className="text-center py-8 text-gray-700">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="font-medium">Nenhuma compra parcelada encontrada</p>
                  <p className="text-sm font-medium">Adicione sua primeira compra parcelada no cartão</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredTransactions().map((transaction) => (
                    <InstallmentTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingInstallments.length === 0 ? (
                <div className="text-center py-8 text-gray-700">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                  <p className="font-medium">Nenhuma parcela pendente</p>
                  <p className="text-sm font-medium">Todas as suas compras parceladas estão em dia!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingInstallments.map((transaction) => (
                    <InstallmentTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-4">
              {completedInstallments.length === 0 ? (
                <div className="text-center py-8 text-gray-700">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-400" />
                  <p className="font-medium">Nenhuma parcela paga ainda</p>
                  <p className="text-sm font-medium">As parcelas pagas aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedInstallments.map((transaction) => (
                    <InstallmentTransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal do formulário */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Editar Compra Parcelada" : "Nova Compra Parcelada"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
            transactionToEdit={editingTransaction}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 