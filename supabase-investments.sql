CREATE TYPE asset_class AS ENUM ('stock', 'fii', 'etf', 'fixed_income', 'crypto');
CREATE TYPE investment_tx_type AS ENUM ('buy', 'sell', 'dividend', 'interest', 'split', 'fee', 'tax', 'transfer');
CREATE TYPE investment_account_type AS ENUM ('brokerage', 'bank', 'wallet');

CREATE TABLE IF NOT EXISTS investment_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  name TEXT,
  class asset_class NOT NULL,
  sector TEXT,
  currency TEXT DEFAULT 'BRL',
  risk_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_assets_user_ticker ON investment_assets(user_id, ticker);
CREATE INDEX IF NOT EXISTS idx_investment_assets_class ON investment_assets(class);
CREATE INDEX IF NOT EXISTS idx_investment_assets_sector ON investment_assets(sector);

ALTER TABLE investment_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY investment_assets_own_data ON investment_assets FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

CREATE TABLE IF NOT EXISTS investment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  broker TEXT,
  account_code TEXT,
  type investment_account_type DEFAULT 'brokerage',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_accounts_user ON investment_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_accounts_type ON investment_accounts(type);

ALTER TABLE investment_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY investment_accounts_own_data ON investment_accounts FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

CREATE TABLE IF NOT EXISTS investment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES investment_assets(id) ON DELETE SET NULL,
  account_id UUID REFERENCES investment_accounts(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type investment_tx_type NOT NULL,
  quantity DECIMAL(18,8) DEFAULT 0,
  unit_price DECIMAL(18,8) DEFAULT 0,
  fees DECIMAL(18,8) DEFAULT 0,
  taxes DECIMAL(18,8) DEFAULT 0,
  cash_flow DECIMAL(18,8) DEFAULT 0,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investment_tx_user ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_tx_asset ON investment_transactions(asset_id);
CREATE INDEX IF NOT EXISTS idx_investment_tx_account ON investment_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_investment_tx_date ON investment_transactions(date);
CREATE INDEX IF NOT EXISTS idx_investment_tx_type ON investment_transactions(type);

ALTER TABLE investment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY investment_transactions_own_data ON investment_transactions FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

CREATE TABLE IF NOT EXISTS investment_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class asset_class NOT NULL,
  target_percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_targets_user_class ON investment_targets(user_id, class);

ALTER TABLE investment_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY investment_targets_own_data ON investment_targets FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text)
);

CREATE TABLE IF NOT EXISTS investment_prices (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID REFERENCES investment_assets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  close DECIMAL(18,8) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_prices_asset_date ON investment_prices(asset_id, date);
CREATE INDEX IF NOT EXISTS idx_investment_prices_date ON investment_prices(date);

CREATE OR REPLACE VIEW investment_positions AS
SELECT
  t.user_id,
  t.asset_id,
  t.account_id,
  COALESCE(SUM(CASE 
    WHEN t.type = 'buy' THEN t.quantity 
    WHEN t.type = 'sell' THEN -t.quantity 
    ELSE 0 END), 0) AS quantity,
  COALESCE(
    SUM(CASE WHEN t.type = 'buy' THEN t.quantity * t.unit_price ELSE 0 END) 
    / NULLIF(SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE 0 END), 0),
    0
  ) AS avg_price
FROM investment_transactions t
GROUP BY t.user_id, t.asset_id, t.account_id;

-- =====================================
-- NOTES
-- - Positions are computed via VIEW to evitar triggers complexos.
-- - Para leitura segura via cliente, preferir rotas de API server-side.
-- =====================================
