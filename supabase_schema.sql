-- =========================================================================
-- KAOJ STORE - ESQUEMA SUPABASE CON SECCIONES Y SUBSECCIONES DINÁMICAS
-- =========================================================================
-- Ejecuta este script en el Editor SQL de tu panel de Supabase:
-- Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Ejecutar (Run)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TABLA: kaoj_products (Con Sección Principal y Subsección)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'MAQUILLAJES', -- Sección grande: MAQUILLAJES, ACCESORIOS, ROPA
    category TEXT NOT NULL DEFAULT 'Labiales',    -- Subsección (Labiales, Gloss, Vinchas, Blusas...)
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

-- Asegurar columna section si la tabla ya existía
ALTER TABLE public.kaoj_products ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'MAQUILLAJES';

CREATE INDEX IF NOT EXISTS idx_kaoj_products_section ON public.kaoj_products(section);
CREATE INDEX IF NOT EXISTS idx_kaoj_products_category ON public.kaoj_products(category);
CREATE INDEX IF NOT EXISTS idx_kaoj_products_active ON public.kaoj_products(is_active);

-- -------------------------------------------------------------------------
-- 2. TABLA: kaoj_settings (Ajustes, Configuración de Secciones Dinámicas)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_settings (
    id INT PRIMARY KEY DEFAULT 1,
    whatsapp_number TEXT NOT NULL DEFAULT '593999999999',
    deuna_link TEXT DEFAULT 'https://deuna.app/',
    deuna_qr_url TEXT DEFAULT '',
    payphone_link TEXT DEFAULT 'https://payphone.app/',
    payphone_token TEXT DEFAULT '',
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
    points_per_dollar NUMERIC(10, 2) DEFAULT 1.00,
    points_redeem_ratio NUMERIC(10, 2) DEFAULT 10.00,
    points_min_redeem INT DEFAULT 50,
    sections_config JSONB DEFAULT '{
      "MAQUILLAJES": ["Labiales", "Gloss", "Delineadores", "Rubores", "Bálsamos", "Primers", "Rimels", "Bases", "Pestañas"],
      "ACCESORIOS": ["Vinchas", "Cintillos"],
      "ROPA": ["Blusas", "Pantalones", "Vestidos", "Shorts", "Pijamas", "Conjuntos", "Ropa deportiva"]
    }'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columna sections_config si ya existía
ALTER TABLE public.kaoj_settings ADD COLUMN IF NOT EXISTS sections_config JSONB DEFAULT '{
  "MAQUILLAJES": ["Labiales", "Gloss", "Delineadores", "Rubores", "Bálsamos", "Primers", "Rimels", "Bases", "Pestañas"],
  "ACCESORIOS": ["Vinchas", "Cintillos"],
  "ROPA": ["Blusas", "Pantalones", "Vestidos", "Shorts", "Pijamas", "Conjuntos", "Ropa deportiva"]
}'::jsonb;

INSERT INTO public.kaoj_settings (id, whatsapp_number, deuna_link, admin_pin)
VALUES (1, '593999999999', 'https://deuna.app/', '2026')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 3. TABLA: kaoj_customers (Clientes, Código Único y Puntos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
    customer_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    id_card TEXT DEFAULT '',
    address TEXT DEFAULT '',
    points INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kaoj_customers_code ON public.kaoj_customers(customer_code);

-- -------------------------------------------------------------------------
-- 4. TABLA: kaoj_orders (Pedidos, Código Único, Puntos y Descuento)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_orders (
    id BIGSERIAL PRIMARY KEY,
    order_code TEXT UNIQUE NOT NULL,
    customer_code TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_id_card TEXT DEFAULT '',
    customer_email TEXT DEFAULT '',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    delivery_method TEXT NOT NULL,
    delivery_address TEXT DEFAULT '',
    shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    points_earned INT DEFAULT 0,
    points_redeemed INT DEFAULT 0,
    payment_method TEXT NOT NULL,
    receipt_url TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendiente',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kaoj_orders_customer_code ON public.kaoj_orders(customer_code);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_status ON public.kaoj_orders(status);

-- -------------------------------------------------------------------------
-- 5. TABLA: kaoj_carts (Carritos Persistentes de Google)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    customer_code TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 6. TABLA: kaoj_reviews (Muro de Reseñas y Fotos)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_reviews (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES public.kaoj_products(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_code TEXT DEFAULT '',
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    photo_url TEXT DEFAULT '',
    product_name TEXT DEFAULT '',
    is_verified_buyer BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 7. POLÍTICAS RLS (Row Level Security)
-- -------------------------------------------------------------------------
ALTER TABLE public.kaoj_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de productos" ON public.kaoj_products;
CREATE POLICY "Lectura pública de productos" ON public.kaoj_products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Gestión de productos" ON public.kaoj_products;
CREATE POLICY "Gestión de productos" ON public.kaoj_products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública de ajustes" ON public.kaoj_settings;
CREATE POLICY "Lectura pública de ajustes" ON public.kaoj_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Actualización de ajustes" ON public.kaoj_settings;
CREATE POLICY "Actualización de ajustes" ON public.kaoj_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Creación pública de pedidos" ON public.kaoj_orders;
CREATE POLICY "Creación pública de pedidos" ON public.kaoj_orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Lectura de pedidos para rastreo y admin" ON public.kaoj_orders;
CREATE POLICY "Lectura de pedidos para rastreo y admin" ON public.kaoj_orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Actualización de pedidos admin" ON public.kaoj_orders;
CREATE POLICY "Actualización de pedidos admin" ON public.kaoj_orders FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Usuarios gestionan su carrito" ON public.kaoj_carts;
CREATE POLICY "Usuarios gestionan su carrito" ON public.kaoj_carts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso a perfiles de clientes" ON public.kaoj_customers;
CREATE POLICY "Acceso a perfiles de clientes" ON public.kaoj_customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Lectura pública de reseñas aprobadas" ON public.kaoj_reviews;
CREATE POLICY "Lectura pública de reseñas aprobadas" ON public.kaoj_reviews FOR SELECT USING (is_approved = true);
DROP POLICY IF EXISTS "Creación pública de reseñas" ON public.kaoj_reviews;
CREATE POLICY "Creación pública de reseñas" ON public.kaoj_reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Gestión de reseñas admin" ON public.kaoj_reviews;
CREATE POLICY "Gestión de reseñas admin" ON public.kaoj_reviews FOR ALL USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 8. STORAGE BUCKET: kaoj-assets
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaoj-assets', 'kaoj-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso público de lectura a kaoj-assets" ON storage.objects;
CREATE POLICY "Acceso público de lectura a kaoj-assets" ON storage.objects FOR SELECT USING (bucket_id = 'kaoj-assets');
DROP POLICY IF EXISTS "Permitir subida pública a kaoj-assets" ON storage.objects;
CREATE POLICY "Permitir subida pública a kaoj-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kaoj-assets');
DROP POLICY IF EXISTS "Permitir actualización en kaoj-assets" ON storage.objects;
CREATE POLICY "Permitir actualización en kaoj-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'kaoj-assets');

-- -------------------------------------------------------------------------
-- 9. PRODUCTOS INICIALES DE EJEMPLO (MAQUILLAJES, ACCESORIOS Y ROPA)
-- -------------------------------------------------------------------------
-- Limpiar catálogo de prueba anterior para insertar el catálogo categorizado
DELETE FROM public.kaoj_products WHERE id <= 20;

INSERT INTO public.kaoj_products (id, name, section, category, price, discount_price, image, description, variant_label, variants)
VALUES
-- === SECCIÓN: MAQUILLAJES ===
(
    1,
    'Labial Líquido Velvet Matte Longwear',
    'MAQUILLAJES',
    'Labiales',
    9.50,
    7.99,
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80',
    'Fórmula intransferible de alta pigmentación y acabado aterciopelado que dura 16 horas.',
    'Tono',
    '[{"name": "01 Rosa Nude", "stock": 8}, {"name": "02 Rojo Carmesí", "stock": 5}, {"name": "03 Berry Wine", "stock": 4}]'::jsonb
),
(
    2,
    'Lip Gloss Plumper Volume & Crystal Shine',
    'MAQUILLAJES',
    'Gloss',
    8.00,
    6.50,
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop&q=80',
    'Efecto voluminizador instantáneo con ácido hialurónico y destellos brillantes sin sensación pegajosa.',
    'Tono',
    '[{"name": "Cristal Diamond", "stock": 10}, {"name": "Strawberry Glaze", "stock": 7}, {"name": "Peach Sparkle", "stock": 6}]'::jsonb
),
(
    3,
    'Delineador Líquido Waterproof Punta Plumón',
    'MAQUILLAJES',
    'Delineadores',
    6.50,
    NULL,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
    'Trazo ultrafino y negro azabache de secado rápido, a prueba de agua y sudor.',
    'Tono',
    '[{"name": "Negro Intenso (Blackest Black)", "stock": 12}, {"name": "Marrón Espresso", "stock": 6}]'::jsonb
),
(
    4,
    'Rubor Líquido Soft Pinch Dewy Glow',
    'MAQUILLAJES',
    'Rubores',
    10.50,
    8.99,
    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
    'Pigmento líquido de larga duración que se difumina como una segunda piel con acabado radiante.',
    'Tono',
    '[{"name": "Hope (Rosa Durazno)", "stock": 6}, {"name": "Joy (Coral Vibrante)", "stock": 4}, {"name": "Bliss (Rosa Pastel)", "stock": 5}]'::jsonb
),
(
    5,
    'Bálsamo Reparador Labial Manteca de Karité & Coco',
    'MAQUILLAJES',
    'Bálsamos',
    4.50,
    NULL,
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
    'Nutrición intensiva para labios resecos con aroma suave y acabado natural hidratado.',
    'Aroma',
    '[{"name": "Vainilla Francesa", "stock": 15}, {"name": "Frutos Rojos", "stock": 10}, {"name": "Coco Menta", "stock": 8}]'::jsonb
),
(
    6,
    'Primer Facial Matificante Poros Invisibles',
    'MAQUILLAJES',
    'Primers',
    12.00,
    9.99,
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    'Minimiza poros y controla el brillo hasta por 12 horas. Prepara el lienzo perfecto para tu base.',
    'Presentación',
    '[{"name": "Tubo 30ml", "stock": 9}]'::jsonb
),
(
    7,
    'Máscara de Pestañas Efecto Lash Lift & Volumen',
    'MAQUILLAJES',
    'Rimels',
    9.00,
    7.50,
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
    'Cepillo curvo con cerdas multidimensionales que levanta cada pestaña sin dejar grumos.',
    'Fórmula',
    '[{"name": "Waterproof (A prueba de agua)", "stock": 14}, {"name": "Lavable Fácil", "stock": 8}]'::jsonb
),
(
    8,
    'Base de Maquillaje Fluida Cobertura Media Larga Duración',
    'MAQUILLAJES',
    'Bases',
    16.50,
    13.99,
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80',
    'Fórmula ligera transpirable que unifica el tono de la piel con acabado semi-mate natural.',
    'Tono',
    '[{"name": "01 Claro Warm", "stock": 5}, {"name": "02 Medio Natural", "stock": 7}, {"name": "03 Canela Dorado", "stock": 4}]'::jsonb
),
(
    9,
    'Set de Pestañas Postizas 3D Faux Mink Reutilizables',
    'MAQUILLAJES',
    'Pestañas',
    6.00,
    NULL,
    'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800&auto=format&fit=crop&q=80',
    'Banda flexible ultra cómoda y fibras de seda sintética. Reutilizables hasta 20 veces.',
    'Estilo',
    '[{"name": "Foxy Eye (Natural)", "stock": 10}, {"name": "Dramatic Glam (Volumen)", "stock": 8}]'::jsonb
),

-- === SECCIÓN: ACCESORIOS ===
(
    10,
    'Vincha Acolchada de Terciopelo Soft Luxury',
    'ACCESORIOS',
    'Vinchas',
    5.50,
    NULL,
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    'Diseño en relieve acolchado con forro suave antideslizante que no aprieta la cabeza.',
    'Color',
    '[{"name": "Palo de Rosa", "stock": 6}, {"name": "Negro Noche", "stock": 8}, {"name": "Beige Champagne", "stock": 5}]'::jsonb
),
(
    11,
    'Cintillo Elástico de Perlas & Strass Brillante',
    'ACCESORIOS',
    'Cintillos',
    6.50,
    4.99,
    'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=800&auto=format&fit=crop&q=80',
    'Elegante cintillo con engarce fino de perlas y destellos de strass para eventos o diario.',
    'Diseño',
    '[{"name": "Dorado con Perlas", "stock": 7}, {"name": "Plateado Cristales", "stock": 6}]'::jsonb
),

-- === SECCIÓN: ROPA ===
(
    12,
    'Blusa Satinada Elegance Cuello Halter',
    'ROPA',
    'Blusas',
    19.99,
    16.99,
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&auto=format&fit=crop&q=80',
    'Confeccionada en seda satinada de tacto suave, caída fluida y espalda descubierta.',
    'Talla / Color',
    '[{"name": "S - Champagne", "stock": 4}, {"name": "M - Champagne", "stock": 5}, {"name": "S - Negro Noche", "stock": 3}]'::jsonb
),
(
    13,
    'Pantalón Palazzo Tiro Alto con Cinturón de Lazo',
    'ROPA',
    'Pantalones',
    24.50,
    NULL,
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    'Corte palazzo ancho estilizado con tejido fresco de caída perfecta para ocasiones casuales y formales.',
    'Talla',
    '[{"name": "Talla S (28)", "stock": 4}, {"name": "Talla M (30)", "stock": 6}, {"name": "Talla L (32)", "stock": 3}]'::jsonb
),
(
    14,
    'Vestido Midi Floral Romántico de Temporada',
    'ROPA',
    'Vestidos',
    28.50,
    24.99,
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
    'Vestido midi con estampado floral exclusivo, mangas abullonadas y ajuste en cintura.',
    'Talla',
    '[{"name": "Talla S", "stock": 3}, {"name": "Talla M", "stock": 4}, {"name": "Talla L", "stock": 2}]'::jsonb
),
(
    15,
    'Short Denim Ripped Tiro Alto Vintage Fit',
    'ROPA',
    'Shorts',
    18.00,
    14.99,
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80',
    'Short de mezclilla rígida con dobladillo deshilachado y efecto desgastado.',
    'Talla',
    '[{"name": "Talla 28 (S)", "stock": 5}, {"name": "Talla 30 (M)", "stock": 7}, {"name": "Talla 32 (L)", "stock": 4}]'::jsonb
),
(
    16,
    'Pijama de Seda Satinada 2 Piezas Short & Camisola',
    'ROPA',
    'Pijamas',
    21.00,
    17.99,
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    'Suavidad suprema al dormir con detalles de encaje en escote y elástico suave en cintura.',
    'Talla / Color',
    '[{"name": "S - Rosa Nude", "stock": 4}, {"name": "M - Rosa Nude", "stock": 5}, {"name": "S - Verde Esmeralda", "stock": 3}]'::jsonb
),
(
    17,
    'Conjunto Two-Piece Top Asimétrico & Falda Midi',
    'ROPA',
    'Conjuntos',
    29.99,
    25.50,
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
    'Set coordinado en punto canalé elástico que se adapta a tu silueta con elegancia.',
    'Talla',
    '[{"name": "Talla S", "stock": 3}, {"name": "Talla M", "stock": 4}]'::jsonb
),
(
    18,
    'Set Deportivo Seamless Biker & Top Alto Impacto',
    'ROPA',
    'Ropa deportiva',
    23.00,
    19.99,
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=80',
    'Tejido moldeador sin costuras con control de abdomen y compresión de alta sujeción.',
    'Talla / Color',
    '[{"name": "S/M - Malva", "stock": 5}, {"name": "M/L - Malva", "stock": 4}, {"name": "S/M - Negro", "stock": 6}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  section = EXCLUDED.section,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  discount_price = EXCLUDED.discount_price,
  image = EXCLUDED.image,
  description = EXCLUDED.description,
  variants = EXCLUDED.variants;

-- Actualizar secuencia de IDs
SELECT setval('kaoj_products_id_seq', (SELECT MAX(id) FROM public.kaoj_products));
