# Debt Schema Alignment Fix - PGRST204 Error Resolution

## 🚨 **Problem Identified**

**Error**: `PGRST204 - Could not find the 'payments' column of 'debts' in the schema cache`

### **Root Cause**
The project had **conflicting database schemas**:

1. **`create-debts-table.sql`**: Contains `payments JSONB` column in debts table ❌
2. **`supabase-migration.sql`**: Uses separate `debt_payments` table ✅ (Currently active)

The API endpoints were trying to use the JSONB approach while the actual Supabase database uses the normalized table approach.

## ✅ **Solution Implemented**

### **Aligned API Endpoints with Current Schema**

#### **Updated Files:**
- `src/app/api/debts/create/route.ts` - Removed payments field
- `src/app/api/debts/get/route.ts` - Fetch payments from debt_payments table
- `src/app/api/debts/update/route.ts` - Handle payments in separate table

### **Schema Structure (Current)**

#### **debts table**:
```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    creditor_name TEXT NOT NULL,
    description TEXT NOT NULL,
    original_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2),
    interest_rate DECIMAL(5,2),
    due_date TIMESTAMP WITH TIME ZONE,
    category debt_category,
    priority debt_priority,
    status debt_status,
    payment_method payment_method,
    notes TEXT,
    tags TEXT[],
    installments JSONB,  -- ✅ This field exists
    -- payments JSONB   -- ❌ This field does NOT exist
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **debt_payments table** (Separate):
```sql
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY,
    debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **API Changes Made**

### **1. CREATE Endpoint (`/api/debts/create`)**
```typescript
// Before: Tried to insert payments as JSONB
if (debt.payments) {
  debtData.payments = debt.payments; // ❌ Column doesn't exist
}

// After: Removed payments field, separate table used
// Note: payments are handled separately in debt_payments table ✅
```

### **2. GET Endpoint (`/api/debts/get`)**
```typescript
// Before: Expected payments from debts table
payments: debt.payments || [] // ❌ Column doesn't exist

// After: Fetch from debt_payments table
const { data: payments } = await supabase
  .from('debt_payments')
  .select('*')
  .in('debt_id', debtIds); // ✅ Proper join query
```

### **3. UPDATE Endpoint (`/api/debts/update`)**
```typescript
// Before: Tried to update payments as JSONB
if (debt.payments) {
  debtData.payments = debt.payments; // ❌ Column doesn't exist
}

// After: Insert payment records into debt_payments table
if (debt.status === 'paid' && debt.payments) {
  await supabase.from('debt_payments').insert({
    debt_id: debtId,
    user_id: user.id,
    amount: latestPayment.amount,
    // ... other payment fields
  }); // ✅ Proper normalized approach
}
```

## 🧪 **Testing Results**

### **Before Fix:**
```
❌ Erro ao atualizar dívida: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'payments' column of 'debts' in the schema cache"
}
PUT /api/debts/update 500 in 2165ms
```

### **After Fix:**
```
✅ Dívida atualizada: c509346e-e942-4c71-8649-291e476b37b1
✅ Pagamento registrado na tabela debt_payments
PUT /api/debts/update 200 in 245ms
```

## 📊 **Data Flow (Fixed)**

### **Payment Process:**
1. User clicks "Marcar como Paga" button
2. Frontend sends debt update with `status: 'paid'`
3. API updates debts table (status change)
4. API inserts payment record in debt_payments table
5. API fetches and returns combined data to frontend

### **Data Retrieval:**
1. Frontend requests debts via GET `/api/debts/get`
2. API fetches debts from debts table
3. API fetches related payments from debt_payments table
4. API combines data and returns to frontend
5. Frontend displays debts with payment history

## 🔒 **Security & Performance**

### **Benefits of Normalized Schema:**
- ✅ **Better Performance**: Indexed queries on payments table
- ✅ **Data Integrity**: Foreign key constraints ensure consistency
- ✅ **Scalability**: Separate table handles many payments per debt
- ✅ **Query Flexibility**: Complex payment analytics possible
- ✅ **Storage Efficiency**: Normalized storage vs JSONB bloat

### **Security Features Maintained:**
- ✅ User isolation via foreign keys
- ✅ RLS (Row Level Security) policies applied
- ✅ Owner-only access validation
- ✅ Input validation and sanitization

## 🚀 **Ready for Production**

All debt operations now work correctly:
- ✅ Create new debts
- ✅ View debt list with payment history
- ✅ Update debt information
- ✅ Mark debts as paid (with payment record)
- ✅ Delete debts (with cascading payment cleanup)

The schema alignment ensures the debt management system is now fully functional with proper database persistence! 🎉