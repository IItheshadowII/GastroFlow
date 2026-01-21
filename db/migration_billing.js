
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createBillingHistoryTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS billing_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'ARS',
        status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'pending', 'failed'
        payment_id VARCHAR(255), -- Mercado Pago Payment ID
        date TIMESTAMP DEFAULT NOW(),
        description VARCHAR(255),
        invoice_url VARCHAR(500)
    );

    CREATE INDEX IF NOT EXISTS idx_billing_tenant ON billing_history(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_billing_date ON billing_history(date DESC);
    `;

    try {
        await pool.query(query);
        console.log('✅ Billing History table created successfully');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        await pool.end();
    }
};

createBillingHistoryTable();
