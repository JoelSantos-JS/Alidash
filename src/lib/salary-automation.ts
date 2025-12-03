import { createClient } from '@supabase/supabase-js'

export type SalaryAutomationResult = {
  success: boolean
  message?: string
  error?: string
  appliedCount?: number
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function applyUserFixedSalary(userId: string, month: number, year: number): Promise<SalaryAutomationResult> {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('personal_salary_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (settingsError || !settings) {
      return { success: false, error: 'Configurações de salário não encontradas' }
    }

    const paymentDay = Math.min(Math.max(parseInt(settings.payment_day), 1), 31)
    const paymentDate = new Date(year, month - 1, paymentDay)

    const incomeRow = {
      user_id: userId,
      description: settings.description || 'Salário',
      amount: Number(settings.amount),
      category: 'salary',
      source: settings.source || 'job',
      date: paymentDate.toISOString().split('T')[0],
      is_recurring: true,
      is_taxable: Boolean(settings.is_taxable),
      tax_withheld: Number(settings.tax_withheld || 0),
      notes: settings.notes || null
    }

    const { error: insertError } = await supabase
      .from('personal_incomes')
      .insert([incomeRow])

    if (insertError) {
      return { success: false, error: 'Erro ao inserir salário' }
    }

    return { success: true, message: 'Salário aplicado', appliedCount: 1 }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}

export async function applyFixedSalaries(month: number, year: number): Promise<SalaryAutomationResult> {
  try {
    const { data: allSettings, error } = await supabase
      .from('personal_salary_settings')
      .select('*')
      .eq('is_active', true)

    if (error) {
      return { success: false, error: 'Erro ao buscar configurações' }
    }

    const settingsList = allSettings || []
    let applied = 0

    for (const s of settingsList) {
      const res = await applyUserFixedSalary(s.user_id, month, year)
      if (res.success) applied++
    }

    return { success: true, message: 'Salários aplicados', appliedCount: applied }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}

