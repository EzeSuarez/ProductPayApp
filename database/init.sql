-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price_in_cents BIGINT NOT NULL CHECK (price_in_cents >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    legal_id VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    tracking_number VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    customer_id UUID REFERENCES customers(id),
    delivery_id UUID REFERENCES deliveries(id),
    product_amount_in_cents BIGINT NOT NULL,
    base_fee_in_cents BIGINT NOT NULL,
    delivery_fee_in_cents BIGINT NOT NULL,
    total_amount_in_cents BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED', 'ERROR')),
    gateway_transaction_id VARCHAR(255),
    card_brand VARCHAR(50),
    last_four VARCHAR(4),
    error_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);

-- SEED DATA: Curated dummy products
INSERT INTO products (id, name, description, price_in_cents, stock, image_url)
VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Sony WH-1000XM5 Wireless Headphones (Midnight Black)',
    'Industry-leading noise canceling with Auto NC Optimizer, crystal clear hands-free calling, and 30-hour battery life.',
    145000000,
    12,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
  ),
  (
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Apple Watch Series 9 GPS 45mm (Space Black)',
    'Smarter, brighter, and mightier. Double tap gesture, S9 SiP chip, and advanced health sensors.',
    215000000,
    8,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'
  ),
  (
    'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f',
    'Minimalist Leather Travel Backpack (Matte Black)',
    'Water-resistant full-grain leather, padded 16-inch laptop compartment, and ergonomic shoulder straps.',
    38000000,
    25,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
  ),
  (
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'Keychron K2 Pro Mechanical Keyboard',
    'Wireless QMK/VIA custom mechanical keyboard, RGB backlighting, hot-swappable switches, sound-absorbing foam.',
    52000000,
    15,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
  ),
  (
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Fujifilm X100V Digital Camera (Silver & Black)',
    '26.1MP APS-C X-Trans BSI CMOS sensor, fixed 23mm f/2 lens, hybrid optical/electronic viewfinder, 4K video.',
    689000000,
    4,
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80'
  ),
  (
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'Hario V60 Ceramic Drip Set (Monochrome Edition)',
    'Classic pour-over brewer with heatproof glass server, measurement scale, and ergonomic kettle spout.',
    19500000,
    30,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80'
  )
ON CONFLICT (id) DO NOTHING;
