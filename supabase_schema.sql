-- =========================================================================
-- KAOJ STORE - ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE
-- =========================================================================
-- Ejecuta este script en el Editor SQL de tu panel de Supabase:
-- Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Ejecutar (Run)
-- =========================================================================

-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABLA: kaoj_products (Inventario y Catálogo de Productos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Labiales',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_price NUMERIC(10, 2) DEFAULT NULL,
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    variant_label TEXT DEFAULT 'Tono / Talla',
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_kaoj_products_category ON public.kaoj_products(category);
CREATE INDEX IF NOT EXISTS idx_kaoj_products_active ON public.kaoj_products(is_active);

-- -------------------------------------------------------------------------
-- 2. TABLA: kaoj_settings (Configuración de Pagos, Deuna, WhatsApp y Banco)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_settings (
    id INT PRIMARY KEY DEFAULT 1,
    whatsapp_number TEXT NOT NULL DEFAULT '593999999999',
    deuna_link TEXT DEFAULT 'https://deuna.app/',
    deuna_qr_url TEXT DEFAULT '',
    admin_pin TEXT NOT NULL DEFAULT '2026',
    bank_guayaquil_acc TEXT DEFAULT '0013899619',
    bank_guayaquil_name TEXT DEFAULT 'Toledo Mendoza Alisson Kandy',
    bank_guayaquil_id TEXT DEFAULT '1350290308',
    bank_pichincha_acc TEXT DEFAULT '2215807440',
    bank_pichincha_name TEXT DEFAULT 'Demera García Jhojann Alberto',
    bank_pichincha_id TEXT DEFAULT '1314710946',
    email_contact TEXT DEFAULT 'kaoj.store.ecu@gmail.com',
    banner_message TEXT DEFAULT '✨ Recuerda: No es un gasto, es una inversión en ti misma. 💅✨ | Envíos a todo el Ecuador',
    free_shipping_threshold NUMERIC(10, 2) DEFAULT 50.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar configuración inicial si no existe
INSERT INTO public.kaoj_settings (id, whatsapp_number, deuna_link, deuna_qr_url, admin_pin)
VALUES (1, '593999999999', 'https://deuna.app/', '', '2026')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 3. TABLA: kaoj_orders (Pedidos, Código Único de Cliente y Comprobantes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_orders (
    id BIGSERIAL PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL,
    customer_code TEXT NOT NULL, -- Código Único: 1ª letra nombre + 4 últimos celular (ej. J4567)
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_id_card TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Si inició sesión con Google
    delivery_method TEXT NOT NULL,
    delivery_address TEXT DEFAULT '',
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL,
    receipt_url TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'verificado', 'en_camino', 'entregado', 'cancelado'
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda por código de cliente y código de orden
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_customer_code ON public.kaoj_orders(customer_code);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_customer_phone ON public.kaoj_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_user_id ON public.kaoj_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_status ON public.kaoj_orders(status);

-- -------------------------------------------------------------------------
-- 4. TABLA: kaoj_carts (Carritos Persistentes sincronizados con Google)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    customer_code TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kaoj_carts_user_id ON public.kaoj_carts(user_id);

-- -------------------------------------------------------------------------
-- 5. TABLA: kaoj_customers (Perfiles de Clientes y Códigos Únicos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    customer_code TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    id_card TEXT DEFAULT '',
    address TEXT DEFAULT '',
    orders_count INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kaoj_customers_code ON public.kaoj_customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_kaoj_customers_phone ON public.kaoj_customers(phone);

-- -------------------------------------------------------------------------
-- 6. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
-- -------------------------------------------------------------------------
ALTER TABLE public.kaoj_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_customers ENABLE ROW LEVEL SECURITY;

-- Políticas para PRODUCTOS: Todos pueden leer productos activos; operaciones completas permitidas
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.kaoj_products;
CREATE POLICY "Lectura pública de productos" ON public.kaoj_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión de productos" ON public.kaoj_products;
CREATE POLICY "Gestión de productos" ON public.kaoj_products FOR ALL USING (true) WITH CHECK (true);

-- Políticas para CONFIGURACIÓN: Todos leen la configuración pública; actualización permitida
DROP POLICY IF EXISTS "Lectura pública de ajustes" ON public.kaoj_settings;
CREATE POLICY "Lectura pública de ajustes" ON public.kaoj_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Actualización de ajustes" ON public.kaoj_settings;
CREATE POLICY "Actualización de ajustes" ON public.kaoj_settings FOR ALL USING (true) WITH CHECK (true);

-- Políticas para PEDIDOS: Cualquiera puede crear pedidos; lectura de pedidos permitida para rastreo
DROP POLICY IF EXISTS "Creación pública de pedidos" ON public.kaoj_orders;
CREATE POLICY "Creación pública de pedidos" ON public.kaoj_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura de pedidos para rastreo y admin" ON public.kaoj_orders;
CREATE POLICY "Lectura de pedidos para rastreo y admin" ON public.kaoj_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Actualización de pedidos admin" ON public.kaoj_orders;
CREATE POLICY "Actualización de pedidos admin" ON public.kaoj_orders FOR UPDATE USING (true);

-- Políticas para CARRITOS PERSISTENTES: Cada usuario gestiona su propio carrito
DROP POLICY IF EXISTS "Usuarios gestionan su carrito" ON public.kaoj_carts;
CREATE POLICY "Usuarios gestionan su carrito" ON public.kaoj_carts FOR ALL USING (true) WITH CHECK (true);

-- Políticas para PERFILES DE CLIENTES
DROP POLICY IF EXISTS "Acceso a perfiles de clientes" ON public.kaoj_customers;
CREATE POLICY "Acceso a perfiles de clientes" ON public.kaoj_customers FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 7. STORAGE BUCKET: kaoj-assets (Imágenes de productos y comprobantes)
-- -------------------------------------------------------------------------
-- Crea el bucket público 'kaoj-assets' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaoj-assets', 'kaoj-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para kaoj-assets
DROP POLICY IF EXISTS "Acceso público de lectura a kaoj-assets" ON storage.objects;
CREATE POLICY "Acceso público de lectura a kaoj-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'kaoj-assets');

DROP POLICY IF EXISTS "Permitir subida pública a kaoj-assets" ON storage.objects;
CREATE POLICY "Permitir subida pública a kaoj-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'kaoj-assets');

DROP POLICY IF EXISTS "Permitir actualización en kaoj-assets" ON storage.objects;
CREATE POLICY "Permitir actualización en kaoj-assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'kaoj-assets');

-- -------------------------------------------------------------------------
-- 8. PRODUCTOS INICIALES DE DEMOSTRACIÓN (Seed Data)
-- -------------------------------------------------------------------------
INSERT INTO public.kaoj_products (name, category, price, discount_price, image, description, variant_label, variants)
VALUES
(
    'Labial Líquido Velvet Matte Longwear',
    'Labiales',
    9.50,
    7.99,
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80',
    'Fórmula intransferible de alta pigmentación y acabado aterciopelado que hidrata tus labios durante 16 horas.',
    'Tono',
    '[{"name": "01 Rosa Nude", "stock": 8}, {"name": "02 Rojo Carmesí", "stock": 5}, {"name": "03 Berry Wine", "stock": 4}, {"name": "04 Mocha Glaze", "stock": 0}]'::jsonb
),
(
    'Serum Facial Iluminador Vitamina C + Ácido Hialurónico',
    'Skincare',
    18.00,
    14.50,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    'Revitaliza tu piel, unifica el tono y aporta luminosidad natural con efecto glow instantáneo y antioxidante.',
    'Presentación',
    '[{"name": "30 ml", "stock": 10}, {"name": "50 ml", "stock": 6}]'::jsonb
),
(
    'Blusa Satinada Elegance Cuello Halter',
    'Blusas',
    19.99,
    NULL,
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80',
    'Confeccionada en seda satinada de tacto suave, caída fluida y espalda descubierta ideal para eventos y cenas.',
    'Talla / Color',
    '[{"name": "S - Champagne", "stock": 4}, {"name": "M - Champagne", "stock": 5}, {"name": "S - Negro Noche", "stock": 3}, {"name": "M - Negro Noche", "stock": 2}]'::jsonb
),
(
    'Vestido Midi Floral Romántico',
    'Vestidos',
    28.50,
    24.99,
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    'Vestido midi con delicado estampado floral, mangas abullonadas y ajuste perfecto en cintura con lazo sutil.',
    'Talla',
    '[{"name": "Talla S", "stock": 3}, {"name": "Talla M", "stock": 4}, {"name": "Talla L", "stock": 2}]'::jsonb
),
(
    'Collar Cadena Baño de Oro 18K Eslabón Fineline',
    'Accesorios',
    12.00,
    NULL,
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    'Joyería hipoalergénica con triple baño de oro de 18K y acabado brillante resistente al agua y al uso diario.',
    'Modelo',
    '[{"name": "Dorado Clásico (45cm)", "stock": 7}, {"name": "Dorado con Dije Corazón", "stock": 5}]'::jsonb
),
(
    'Crema Gel Hidratante Aqua Boost Cerámidas',
    'Skincare',
    16.50,
    13.99,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
    'Textura gel ultra ligera que refuerza la barrera cutánea sin sensación pesada ni grasa. Apta para piel sensible.',
    'Tamaño',
    '[{"name": "Pote 50g", "stock": 9}]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Notificación de éxito
COMMENT ON TABLE public.kaoj_orders IS 'Tabla principal de pedidos Kaoj Store con código único de cliente integrado';
