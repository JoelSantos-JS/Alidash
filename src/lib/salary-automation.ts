import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SalarySettings {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  payment_day: number;
  is_active: boolean;
  is_taxable: boolean;
  tax_withheld: number;
  source: string;
  notes?: string;
}

/**
 * Aplica salários fixos para todos os usuários ativos
 * @param targetMonth Mês alvo (1-12)
 * @param targetYear Ano alvo
 * @returns Resultado da operação
 */
export async function applyFixedSalaries(targetMonth: number, targetYear: number) {
  try {
    console.log(`🔄 Aplicando salários fixos para ${targetMonth}/${targetYear}...`);

    // Buscar todas as configurações de salário ativas
    const { data: salarySettings, error: settingsError } = await supabase
      .from('personal_salary_settings')
      .select('*')
      .eq('is_active', true);

    if (settingsError) {
      console.error('❌ Erro ao buscar configurações de salário:', settingsError);
      return { success: false, error: settingsError.message };
    }

    if (!salarySettings || salarySettings.length === 0) {
      console.log('ℹ️ Nenhuma configuração de salário ativa encontrada');
      return { success: true, processed: 0, message: 'Nenhuma configuração ativa' };
    }

    let processedCount = 0;
    let errors: string[] = [];

    for (const settings of salarySettings as SalarySettings[]) {
      try {
        // Verificar se já existe uma entrada de salário para este mês/ano
        const targetDate = new Date(targetYear, targetMonth - 1, settings.payment_day);
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0);

        const { data: existingIncome, error: checkError } = await supabase
          .from('personal_incomes')
          .select('id')
          .eq('user_id', settings.user_id)
          .eq('category', 'salary')
          .eq('description', settings.description)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0])
          .limit(1);

        if (checkError) {
          console.error(`❌ Erro ao verificar renda existente para usuário ${settings.user_id}:`, checkError);
          errors.push(`Usuário ${settings.user_id}: ${checkError.message}`);
          continue;
        }

        if (existingIncome && existingIncome.length > 0) {
          console.log(`ℹ️ Salário já aplicado para usuário ${settings.user_id} em ${targetMonth}/${targetYear}`);
          continue;
        }

        // Calcular valor líquido se houver desconto de imposto
        const netAmount = settings.is_taxable 
          ? settings.amount - settings.tax_withheld 
          : settings.amount;

        // Criar entrada de renda
        const { error: insertError } = await supabase
          .from('personal_incomes')
          .insert({
            user_id: settings.user_id,
            description: settings.description,
            amount: netAmount,
            category: 'salary',
            date: targetDate.toISOString().split('T')[0],
            source: settings.source,
            is_recurring: true,
            recurrence_type: 'monthly',
            is_taxable: settings.is_taxable,
            tax_withheld: settings.tax_withheld,
            notes: settings.notes ? `Salário automático: ${settings.notes}` : 'Salário automático'
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir salário para usuário ${settings.user_id}:`, insertError);
          errors.push(`Usuário ${settings.user_id}: ${insertError.message}`);
          continue;
        }

        console.log(`✅ Salário aplicado para usuário ${settings.user_id}: ${netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        processedCount++;

      } catch (error) {
        console.error(`❌ Erro geral ao processar usuário ${settings.user_id}:`, error);
        errors.push(`Usuário ${settings.user_id}: ${error}`);
      }
    }

    const result = {
      success: errors.length === 0,
      processed: processedCount,
      total: salarySettings.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Processados ${processedCount} de ${salarySettings.length} salários`
    };

    console.log(`🎉 Processamento concluído: ${result.message}`);
    if (errors.length > 0) {
      console.log(`⚠️ Erros encontrados: ${errors.length}`);
    }

    return result;

  } catch (error) {
    console.error('❌ Erro geral na aplicação de salários:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Aplica salário fixo para um usuário específico
 * @param userId ID do usuário
 * @param targetMonth Mês alvo (1-12)
 * @param targetYear Ano alvo
 * @returns Resultado da operação
 */
export async function applyUserFixedSalary(userId: string, targetMonth: number, targetYear: number) {
  try {
    console.log(`🔄 Aplicando salário fixo para usuário ${userId} em ${targetMonth}/${targetYear}...`);

    // Buscar configuração de salário do usuário
    const { data: salarySettings, error: settingsError } = await supabase
      .from('personal_salary_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (settingsError) {
      console.error('❌ Erro ao buscar configuração de salário:', settingsError);
      return { success: false, error: settingsError.message };
    }

    if (!salarySettings) {
      return { success: false, error: 'Configuração de salário não encontrada ou inativa' };
    }

    // Verificar se já existe uma entrada de salário para este mês/ano
    const targetDate = new Date(targetYear, targetMonth - 1, salarySettings.payment_day);
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0);

    const { data: existingIncome, error: checkError } = await supabase
      .from('personal_incomes')
      .select('id')
      .eq('user_id', userId)
      .eq('category', 'salary')
      .eq('description', salarySettings.description)
      .gte('date', startOfMonth.toISOString().split('T')[0])
      .lte('date', endOfMonth.toISOString().split('T')[0])
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar renda existente:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingIncome && existingIncome.length > 0) {
      return { success: false, error: 'Salário já foi aplicado para este mês' };
    }

    // Calcular valor líquido se houver desconto de imposto
    const netAmount = salarySettings.is_taxable 
      ? salarySettings.amount - salarySettings.tax_withheld 
      : salarySettings.amount;

    // Criar entrada de renda
    const { error: insertError } = await supabase
      .from('personal_incomes')
      .insert({
        user_id: userId,
        description: salarySettings.description,
        amount: netAmount,
        category: 'salary',
        date: targetDate.toISOString().split('T')[0],
        source: salarySettings.source,
        is_recurring: true,
        recurrence_type: 'monthly',
        is_taxable: salarySettings.is_taxable,
        tax_withheld: salarySettings.tax_withheld,
        notes: salarySettings.notes ? `Salário automático: ${salarySettings.notes}` : 'Salário automático'
      });

    if (insertError) {
      console.error('❌ Erro ao inserir salário:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log(`✅ Salário aplicado: ${netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
    return { 
      success: true, 
      amount: netAmount,
      message: 'Salário aplicado com sucesso' 
    };

  } catch (error) {
    console.error('❌ Erro geral na aplicação de salário:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Obtém o próximo dia de pagamento baseado na configuração
 * @param paymentDay Dia do pagamento (1-31)
 * @param currentDate Data atual
 * @returns Próxima data de pagamento
 */
export function getNextPaymentDate(paymentDay: number, currentDate: Date = new Date()): Date {
  const nextPayment = new Date(currentDate.getFullYear(), currentDate.getMonth(), paymentDay);
  
  // Se o dia já passou neste mês, vai para o próximo mês
  if (nextPayment <= currentDate) {
    nextPayment.setMonth(nextPayment.getMonth() + 1);
  }
  
  // Ajustar para o último dia do mês se o dia não existir
  const lastDayOfMonth = new Date(nextPayment.getFullYear(), nextPayment.getMonth() + 1, 0).getDate();
  if (paymentDay > lastDayOfMonth) {
    nextPayment.setDate(lastDayOfMonth);
  }
  
  return nextPayment;
}