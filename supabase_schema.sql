-- =========================================================================
-- KAOJ STORE - ESQUEMA SUPABASE BLINDADO CON SEGURIDAD PRO Y RLS ESTRICTO
-- =========================================================================
-- Ejecuta este script en el Editor SQL de tu panel de Supabase:
-- Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Ejecutar (Run)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. TABLA: kaoj_products (Productos y Variantes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    section TEXT NOT NULL DEFAULT 'MAQUILLAJES',
    category TEXT NOT NULL DEFAULT 'Labiales',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_price NUMERIC(10, 2) DEFAULT NULL,
    image TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    description TEXT DEFAULT '',
    variant_label TEXT DEFAULT 'Tono / Talla',
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kaoj_products ADD COLUMN IF NOT EXISTS section TEXT NOT NULL DEFAULT 'MAQUILLAJES';
ALTER TABLE public.kaoj_products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.kaoj_products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_kaoj_products_section ON public.kaoj_products(section);
CREATE INDEX IF NOT EXISTS idx_kaoj_products_category ON public.kaoj_products(category);
CREATE INDEX IF NOT EXISTS idx_kaoj_products_active ON public.kaoj_products(is_active);

-- -------------------------------------------------------------------------
-- 2. TABLA: kaoj_admin_auth (PIN Hash seguro con Bcrypt - NUNCA expuesto al público)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_admin_auth (
    id INT PRIMARY KEY DEFAULT 1,
    pin_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Si no existe, configurar PIN por defecto '2026' hasheado con bcrypt
INSERT INTO public.kaoj_admin_auth (id, pin_hash)
VALUES (1, crypt('2026', gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 3. TABLA: kaoj_settings (Ajustes Públicos de la Tienda)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_settings (
    id INT PRIMARY KEY DEFAULT 1,
    whatsapp_number TEXT NOT NULL DEFAULT '593963073456',
    deuna_link TEXT DEFAULT 'https://deuna.app/',
    deuna_qr_url TEXT DEFAULT '',
    payphone_link TEXT DEFAULT 'https://payphone.app/',
    payphone_token TEXT DEFAULT '',
    bank_guayaquil_acc TEXT DEFAULT '0013899619',
    bank_guayaquil_name TEXT DEFAULT 'Toledo Mendoza Alisson Kandy',
    bank_guayaquil_id TEXT DEFAULT '1350290308',
    bank_pichincha_acc TEXT DEFAULT '2215807440',
    bank_pichincha_name TEXT DEFAULT 'Demera García Jhojann Alberto',
    bank_pichincha_id TEXT DEFAULT '1314710946',
    email_contact TEXT DEFAULT 'kaoj.store.ecu@gmail.com',
    banner_message TEXT DEFAULT '✨ Alta Cosmética, Accesorios & Moda Chic | Envíos seguros a todo el Ecuador 💅✨',
    free_shipping_threshold NUMERIC(10, 2) DEFAULT 50.00,
    points_per_dollar NUMERIC(10, 2) DEFAULT 1.00,
    points_redeem_ratio NUMERIC(10, 2) DEFAULT 10.00,
    points_min_redeem INT DEFAULT 50,
    sections_config JSONB DEFAULT '{
      "MAQUILLAJES": ["Labiales", "Gloss", "Delineadores", "Rubores", "Bálsamos", "Primers", "Rimels", "Bases", "Pestañas"],
      "ACCESORIOS": ["Vinchas", "Cintillos"],
      "ROPA": ["Blusas", "Pantalones", "Vestidos", "Shorts", "Pijamas", "Conjuntos", "Ropa deportiva"]
    }'::jsonb,
    about_us JSONB,
    shipping_rates JSONB,
    coupons_config JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar columnas necesarias
ALTER TABLE public.kaoj_settings ADD COLUMN IF NOT EXISTS sections_config JSONB DEFAULT '{
  "MAQUILLAJES": ["Labiales", "Gloss", "Delineadores", "Rubores", "Bálsamos", "Primers", "Rimels", "Bases", "Pestañas"],
  "ACCESORIOS": ["Vinchas", "Cintillos"],
  "ROPA": ["Blusas", "Pantalones", "Vestidos", "Shorts", "Pijamas", "Conjuntos", "Ropa deportiva"]
}'::jsonb;
ALTER TABLE public.kaoj_settings ADD COLUMN IF NOT EXISTS about_us JSONB;
ALTER TABLE public.kaoj_settings ADD COLUMN IF NOT EXISTS shipping_rates JSONB;
ALTER TABLE public.kaoj_settings ADD COLUMN IF NOT EXISTS coupons_config JSONB DEFAULT '[]'::jsonb;

-- Si existe la columna antigua admin_pin en kaoj_settings, migrar su valor a kaoj_admin_auth y eliminarla para no exponerla
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'kaoj_settings' AND column_name = 'admin_pin'
    ) THEN
        UPDATE public.kaoj_admin_auth
        SET pin_hash = crypt((SELECT admin_pin FROM public.kaoj_settings WHERE id = 1), gen_salt('bf'))
        WHERE id = 1 AND (SELECT admin_pin FROM public.kaoj_settings WHERE id = 1) IS NOT NULL;
        
        ALTER TABLE public.kaoj_settings DROP COLUMN admin_pin;
    END IF;
END $$;

INSERT INTO public.kaoj_settings (id, whatsapp_number, deuna_link, banner_message)
VALUES (1, '593963073456', 'https://deuna.app/', '✨ Alta Cosmética, Accesorios & Moda Chic | Envíos seguros a todo el Ecuador 💅✨')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 4. TABLA: kaoj_customers (Clientes, Código Único y Puntos - Sin colisión)
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
    points INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,
    orders_count INT DEFAULT 0,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que customer_code no colisione y phone sea el identificador único
DO $$
BEGIN
    ALTER TABLE public.kaoj_customers DROP CONSTRAINT IF EXISTS kaoj_customers_customer_code_key;
    ALTER TABLE public.kaoj_customers DROP CONSTRAINT IF EXISTS kaoj_customers_phone_key;
    ALTER TABLE public.kaoj_customers ADD CONSTRAINT kaoj_customers_phone_key UNIQUE (phone);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_kaoj_customers_code ON public.kaoj_customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_kaoj_customers_phone ON public.kaoj_customers(phone);
CREATE INDEX IF NOT EXISTS idx_kaoj_customers_user ON public.kaoj_customers(user_id);

-- -------------------------------------------------------------------------
-- 5. TABLA: kaoj_orders (Pedidos y Envíos)
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

CREATE INDEX IF NOT EXISTS idx_kaoj_orders_code ON public.kaoj_orders(order_code);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_customer_code ON public.kaoj_orders(customer_code);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_customer_phone ON public.kaoj_orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_status ON public.kaoj_orders(status);
CREATE INDEX IF NOT EXISTS idx_kaoj_orders_user ON public.kaoj_orders(user_id);

-- -------------------------------------------------------------------------
-- 6. TABLA: kaoj_carts (Carritos Persistentes de Google)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kaoj_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    customer_code TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 7. TABLA: kaoj_reviews (Muro de Reseñas y Fotos)
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
    is_verified_buyer BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asegurar que en bases de datos existentes el valor por defecto sea false (requiere moderación)
ALTER TABLE public.kaoj_reviews ALTER COLUMN is_approved SET DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_kaoj_reviews_approved ON public.kaoj_reviews(is_approved);

-- -------------------------------------------------------------------------
-- 8. POLÍTICAS RLS (Row Level Security) - BLINDADAS CONTRA ATAQUES
-- -------------------------------------------------------------------------
ALTER TABLE public.kaoj_admin_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaoj_reviews ENABLE ROW LEVEL SECURITY;

-- 8.1 kaoj_admin_auth: Denegar todo acceso directo
DROP POLICY IF EXISTS "Deny all on admin auth" ON public.kaoj_admin_auth;
DROP POLICY IF EXISTS "Deny all public on admin auth" ON public.kaoj_admin_auth;
CREATE POLICY "Deny all public on admin auth" ON public.kaoj_admin_auth FOR ALL USING (false);

-- 8.2 kaoj_products: Lectura pública de productos activos. Modificaciones solo vía RPC admin
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.kaoj_products;
DROP POLICY IF EXISTS "Gestión de productos" ON public.kaoj_products;
CREATE POLICY "Lectura pública de productos" ON public.kaoj_products FOR SELECT USING (is_active = true);

-- 8.3 kaoj_settings: Lectura pública. Modificaciones solo vía RPC admin
DROP POLICY IF EXISTS "Lectura pública de ajustes" ON public.kaoj_settings;
DROP POLICY IF EXISTS "Actualización de ajustes" ON public.kaoj_settings;
CREATE POLICY "Lectura pública de ajustes" ON public.kaoj_settings FOR SELECT USING (true);

-- 8.4 kaoj_orders: Creación pública al comprar. Lectura restringida a su propio user_id
DROP POLICY IF EXISTS "Creación pública de pedidos" ON public.kaoj_orders;
DROP POLICY IF EXISTS "Lectura de pedidos para rastreo y admin" ON public.kaoj_orders;
DROP POLICY IF EXISTS "Actualización de pedidos admin" ON public.kaoj_orders;
DROP POLICY IF EXISTS "Clientes leen sus propios pedidos" ON public.kaoj_orders;
CREATE POLICY "Creación pública de pedidos" ON public.kaoj_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes leen sus propios pedidos" ON public.kaoj_orders FOR SELECT USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 8.5 kaoj_carts: Los usuarios logueados gestionan su propio carrito
DROP POLICY IF EXISTS "Usuarios gestionan su carrito" ON public.kaoj_carts;
CREATE POLICY "Usuarios gestionan su carrito" ON public.kaoj_carts FOR ALL USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
) WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 8.6 kaoj_customers: Los usuarios logueados leen/actualizan su propio perfil
DROP POLICY IF EXISTS "Acceso a perfiles de clientes" ON public.kaoj_customers;
DROP POLICY IF EXISTS "Clientes gestionan su propio perfil" ON public.kaoj_customers;
CREATE POLICY "Clientes gestionan su propio perfil" ON public.kaoj_customers FOR ALL USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
) WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 8.7 kaoj_reviews: Público lee solo aprobadas. Puede enviar con validación (is_approved forzado a false)
DROP POLICY IF EXISTS "Lectura pública de reseñas aprobadas" ON public.kaoj_reviews;
DROP POLICY IF EXISTS "Creación pública de reseñas" ON public.kaoj_reviews;
DROP POLICY IF EXISTS "Gestión de reseñas admin" ON public.kaoj_reviews;
CREATE POLICY "Lectura pública de reseñas aprobadas" ON public.kaoj_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Creación pública de reseñas" ON public.kaoj_reviews FOR INSERT WITH CHECK (
    rating >= 1 AND rating <= 5 AND LENGTH(comment) <= 1000 AND (is_approved IS NULL OR is_approved = false)
);

-- -------------------------------------------------------------------------
-- 9. FUNCIONES DE SEGURIDAD Y CONTROL ADMINISTRATIVO (SECURITY DEFINER)
-- -------------------------------------------------------------------------

-- 9.1 Verificar PIN de Administrador (Bcrypt)
CREATE OR REPLACE FUNCTION public.kaoj_verify_admin_pin(input_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    matched BOOLEAN;
BEGIN
    SELECT (pin_hash = crypt(input_pin, pin_hash)) INTO matched
    FROM public.kaoj_admin_auth
    WHERE id = 1;
    RETURN COALESCE(matched, false);
END;
$$;

-- 9.2 Cambiar PIN de Administrador
CREATE OR REPLACE FUNCTION public.kaoj_change_admin_pin(current_pin TEXT, new_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    matched BOOLEAN;
BEGIN
    IF LENGTH(new_pin) < 4 THEN
        RAISE EXCEPTION 'El nuevo PIN debe tener al menos 4 caracteres';
    END IF;

    SELECT (pin_hash = crypt(current_pin, pin_hash)) INTO matched
    FROM public.kaoj_admin_auth
    WHERE id = 1;

    IF matched IS NOT TRUE THEN
        RAISE EXCEPTION 'El PIN actual es incorrecto';
    END IF;

    UPDATE public.kaoj_admin_auth
    SET pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = NOW()
    WHERE id = 1;

    RETURN true;
END;
$$;

-- 9.3 Rastreo Seguro de Pedidos para Invitadas (Sin exponer la tabla completa)
CREATE OR REPLACE FUNCTION public.kaoj_track_orders(lookup_query TEXT)
RETURNS SETOF public.kaoj_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_q TEXT := TRIM(lookup_query);
    digits TEXT := REGEXP_REPLACE(clean_q, '\D', '', 'g');
BEGIN
    IF LENGTH(clean_q) < 3 THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT *
    FROM public.kaoj_orders
    WHERE 
        order_code ILIKE clean_q
        OR (LENGTH(digits) >= 8 AND (customer_phone ILIKE '%' || RIGHT(digits, 8) || '%'))
        OR (LENGTH(clean_q) >= 4 AND customer_code ILIKE clean_q)
    ORDER BY created_at DESC
    LIMIT 20;
END;
$$;

-- 9.4 Descuento Seguro de Stock en Base de Datos (Atómico, sin permisos UPDATE al público)
CREATE OR REPLACE FUNCTION public.kaoj_decrement_order_stock(order_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    item JSONB;
    prod_id BIGINT;
    var_name TEXT;
    item_qty INT;
    cur_variants JSONB;
    updated_variants JSONB;
BEGIN
    FOR item IN SELECT * FROM jsonb_array_elements(order_items)
    LOOP
        prod_id := (item->>'productId')::BIGINT;
        var_name := item->>'variant';
        item_qty := COALESCE((item->>'qty')::INT, 1);

        SELECT variants INTO cur_variants FROM public.kaoj_products WHERE id = prod_id;

        IF cur_variants IS NOT NULL THEN
            SELECT jsonb_agg(
                CASE 
                    WHEN v->>'name' = var_name THEN
                        jsonb_set(v, '{stock}', to_jsonb(GREATEST(0, (v->>'stock')::INT - item_qty)))
                    ELSE v
                END
            ) INTO updated_variants
            FROM jsonb_array_elements(cur_variants) v;

            UPDATE public.kaoj_products
            SET variants = updated_variants, updated_at = NOW()
            WHERE id = prod_id;
        END IF;
    END LOOP;
END;
$$;

-- 9.5 Guardar o Actualizar Perfil de Cliente de forma segura (Sin colisión de Códigos VIP)
CREATE OR REPLACE FUNCTION public.kaoj_save_customer_order(
    cust_code TEXT,
    cust_name TEXT,
    cust_phone TEXT,
    cust_email TEXT,
    cust_id_card TEXT,
    cust_address TEXT,
    cust_user_id UUID,
    points_to_add INT,
    points_to_deduct INT,
    order_total NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_phone TEXT := REGEXP_REPLACE(cust_phone, '\D', '', 'g');
    existing_id UUID;
    cur_pts INT := 0;
    new_pts INT;
    cur_spent NUMERIC := 0;
    cur_orders INT := 0;
BEGIN
    IF clean_phone LIKE '593%' AND LENGTH(clean_phone) = 12 THEN
        clean_phone := '0' || SUBSTRING(clean_phone FROM 4);
    END IF;

    SELECT id, points, total_spent, orders_count
    INTO existing_id, cur_pts, cur_spent, cur_orders
    FROM public.kaoj_customers
    WHERE phone = clean_phone OR (cust_user_id IS NOT NULL AND user_id = cust_user_id)
    LIMIT 1;

    new_pts := GREATEST(0, COALESCE(cur_pts, 0) - points_to_deduct) + points_to_add;

    IF existing_id IS NOT NULL THEN
        UPDATE public.kaoj_customers
        SET
            name = COALESCE(NULLIF(cust_name, ''), name),
            email = COALESCE(NULLIF(cust_email, ''), email),
            id_card = COALESCE(NULLIF(cust_id_card, ''), id_card),
            address = COALESCE(NULLIF(cust_address, ''), address),
            user_id = COALESCE(cust_user_id, user_id),
            points = new_pts,
            total_spent = COALESCE(cur_spent, 0) + order_total,
            orders_count = COALESCE(cur_orders, 0) + 1,
            updated_at = NOW()
        WHERE id = existing_id;
    ELSE
        INSERT INTO public.kaoj_customers (
            customer_code, name, phone, email, id_card, address, user_id,
            points, total_spent, orders_count
        ) VALUES (
            cust_code, cust_name, clean_phone, cust_email, cust_id_card, cust_address, cust_user_id,
            new_pts, order_total, 1
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'points', new_pts);
END;
$$;

-- 9.6 Obtener Pedidos (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_get_orders(admin_pin TEXT)
RETURNS SETOF public.kaoj_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    RETURN QUERY SELECT * FROM public.kaoj_orders ORDER BY created_at DESC;
END;
$$;

-- 9.7 Actualizar Estado de Pedido (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_update_order_status(admin_pin TEXT, target_order_id BIGINT, new_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    UPDATE public.kaoj_orders
    SET status = new_status, updated_at = NOW()
    WHERE id = target_order_id;

    RETURN true;
END;
$$;

-- 9.8 Revertir / Cancelar Venta Atómicamente (Devuelve stock y revierte puntos en una sola transacción)
CREATE OR REPLACE FUNCTION public.kaoj_admin_cancel_order(admin_pin TEXT, target_order_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    ord RECORD;
    item JSONB;
    prod_id BIGINT;
    var_name TEXT;
    item_qty INT;
    cur_variants JSONB;
    updated_variants JSONB;
    cust RECORD;
    items_restored INT := 0;
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    SELECT * INTO ord FROM public.kaoj_orders WHERE id = target_order_id;
    IF ord IS NULL THEN
        RAISE EXCEPTION 'Orden no encontrada';
    END IF;

    IF ord.status = 'cancelado' THEN
        RETURN jsonb_build_object('success', false, 'error', 'La orden ya está cancelada');
    END IF;

    -- 1. Devolver stock de productos
    FOR item IN SELECT * FROM jsonb_array_elements(ord.items)
    LOOP
        prod_id := (item->>'productId')::BIGINT;
        var_name := item->>'variant';
        item_qty := COALESCE((item->>'qty')::INT, 1);
        items_restored := items_restored + item_qty;

        SELECT variants INTO cur_variants FROM public.kaoj_products WHERE id = prod_id;

        IF cur_variants IS NOT NULL THEN
            SELECT jsonb_agg(
                CASE 
                    WHEN v->>'name' = var_name THEN
                        jsonb_set(v, '{stock}', to_jsonb((v->>'stock')::INT + item_qty))
                    ELSE v
                END
            ) INTO updated_variants
            FROM jsonb_array_elements(cur_variants) v;

            UPDATE public.kaoj_products
            SET variants = updated_variants, updated_at = NOW()
            WHERE id = prod_id;
        END IF;
    END LOOP;

    -- 2. Revertir puntos y total de la clienta
    IF ord.customer_phone IS NOT NULL AND ord.customer_phone != '' THEN
        SELECT * INTO cust FROM public.kaoj_customers WHERE phone = ord.customer_phone OR customer_code = ord.customer_code LIMIT 1;
        IF cust IS NOT NULL THEN
            UPDATE public.kaoj_customers
            SET
                points = GREATEST(0, cust.points - COALESCE(ord.points_earned, 0) + COALESCE(ord.points_redeemed, 0)),
                total_spent = GREATEST(0, cust.total_spent - ord.total),
                orders_count = GREATEST(0, cust.orders_count - 1),
                updated_at = NOW()
            WHERE id = cust.id;
        END IF;
    END IF;

    -- 3. Marcar orden como cancelada
    UPDATE public.kaoj_orders
    SET
        status = 'cancelado',
        admin_notes = COALESCE(admin_notes || ' | ', '') || '[VENTA REVERTIDA: Stock devuelto ' || TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') || ']',
        updated_at = NOW()
    WHERE id = target_order_id;

    RETURN jsonb_build_object('success', true, 'restored_items', items_restored);
END;
$$;

-- 9.9 Obtener Clientes VIP (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_get_customers(admin_pin TEXT)
RETURNS SETOF public.kaoj_customers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    RETURN QUERY SELECT * FROM public.kaoj_customers ORDER BY total_spent DESC;
END;
$$;

-- 9.10 Guardar Ajustes de la Tienda (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_save_settings(admin_pin TEXT, settings_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    UPDATE public.kaoj_settings
    SET
        whatsapp_number = COALESCE(settings_data->>'whatsapp_number', whatsapp_number),
        deuna_link = COALESCE(settings_data->>'deuna_link', deuna_link),
        deuna_qr_url = COALESCE(settings_data->>'deuna_qr_url', deuna_qr_url),
        payphone_link = COALESCE(settings_data->>'payphone_link', payphone_link),
        payphone_token = COALESCE(settings_data->>'payphone_token', payphone_token),
        bank_guayaquil_acc = COALESCE(settings_data->>'bank_guayaquil_acc', bank_guayaquil_acc),
        bank_guayaquil_name = COALESCE(settings_data->>'bank_guayaquil_name', bank_guayaquil_name),
        bank_guayaquil_id = COALESCE(settings_data->>'bank_guayaquil_id', bank_guayaquil_id),
        bank_pichincha_acc = COALESCE(settings_data->>'bank_pichincha_acc', bank_pichincha_acc),
        bank_pichincha_name = COALESCE(settings_data->>'bank_pichincha_name', bank_pichincha_name),
        bank_pichincha_id = COALESCE(settings_data->>'bank_pichincha_id', bank_pichincha_id),
        email_contact = COALESCE(settings_data->>'email_contact', email_contact),
        banner_message = COALESCE(settings_data->>'banner_message', banner_message),
        free_shipping_threshold = COALESCE((settings_data->>'free_shipping_threshold')::NUMERIC, free_shipping_threshold),
        sections_config = COALESCE(settings_data->'sections_config', sections_config),
        about_us = COALESCE(settings_data->'about_us', about_us),
        shipping_rates = COALESCE(settings_data->'shipping_rates', shipping_rates),
        coupons_config = COALESCE(settings_data->'coupons_config', coupons_config),
        updated_at = NOW()
    WHERE id = 1;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 9.11 Crear o Editar Producto (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_save_product(admin_pin TEXT, prod_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_id BIGINT := NULLIF(prod_data->>'id', '')::BIGINT;
    new_id BIGINT;
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    IF target_id IS NOT NULL AND target_id > 0 THEN
        UPDATE public.kaoj_products
        SET
            name = prod_data->>'name',
            section = COALESCE(prod_data->>'section', 'MAQUILLAJES'),
            category = COALESCE(prod_data->>'category', 'Labiales'),
            price = (prod_data->>'price')::NUMERIC,
            discount_price = NULLIF(prod_data->>'discount_price', '')::NUMERIC,
            image = prod_data->>'image',
            images = COALESCE(prod_data->'images', '[]'::jsonb),
            description = COALESCE(prod_data->>'description', ''),
            variant_label = COALESCE(prod_data->>'variant_label', 'Tono / Talla'),
            variants = COALESCE(prod_data->'variants', '[]'::jsonb),
            updated_at = NOW()
        WHERE id = target_id;

        RETURN jsonb_build_object('success', true, 'id', target_id);
    ELSE
        INSERT INTO public.kaoj_products (
            name, section, category, price, discount_price, image, images,
            description, variant_label, variants, is_active
        ) VALUES (
            prod_data->>'name',
            COALESCE(prod_data->>'section', 'MAQUILLAJES'),
            COALESCE(prod_data->>'category', 'Labiales'),
            (prod_data->>'price')::NUMERIC,
            NULLIF(prod_data->>'discount_price', '')::NUMERIC,
            prod_data->>'image',
            COALESCE(prod_data->'images', '[]'::jsonb),
            COALESCE(prod_data->>'description', ''),
            COALESCE(prod_data->>'variant_label', 'Tono / Talla'),
            COALESCE(prod_data->'variants', '[]'::jsonb),
            true
        ) RETURNING id INTO new_id;

        RETURN jsonb_build_object('success', true, 'id', new_id);
    END IF;
END;
$$;

-- 9.12 Desactivar Producto (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_delete_product(admin_pin TEXT, prod_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    UPDATE public.kaoj_products SET is_active = false, updated_at = NOW() WHERE id = prod_id;
    RETURN true;
END;
$$;

-- 9.13 Ajuste Rápido / Directo de Stock de Variantes (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_update_stock(
    admin_pin TEXT, 
    prod_id BIGINT, 
    var_name TEXT, 
    stock_val INT, 
    is_delta BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cur_vars JSONB;
    new_vars JSONB;
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    SELECT variants INTO cur_vars FROM public.kaoj_products WHERE id = prod_id;
    IF cur_vars IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Producto no encontrado');
    END IF;

    SELECT jsonb_agg(
        CASE 
            WHEN v->>'name' = var_name THEN
                jsonb_set(
                    v, 
                    '{stock}', 
                    to_jsonb(
                        GREATEST(0, CASE WHEN is_delta THEN ((v->>'stock')::INT + stock_val) ELSE stock_val END)
                    )
                )
            ELSE v
        END
    ) INTO new_vars
    FROM jsonb_array_elements(cur_vars) v;

    UPDATE public.kaoj_products SET variants = new_vars, updated_at = NOW() WHERE id = prod_id;

    RETURN jsonb_build_object('success', true, 'variants', new_vars);
END;
$$;

-- 9.14 Obtener Todas las Reseñas para Moderación (Solo Administrador Autorizado)
CREATE OR REPLACE FUNCTION public.kaoj_admin_get_all_reviews(admin_pin TEXT)
RETURNS SETOF public.kaoj_reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    RETURN QUERY SELECT * FROM public.kaoj_reviews ORDER BY created_at DESC;
END;
$$;

-- 9.15 Moderar Reseña (Aprobar / Ocultar)
CREATE OR REPLACE FUNCTION public.kaoj_admin_moderate_review(admin_pin TEXT, rev_id BIGINT, approve BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    UPDATE public.kaoj_reviews SET is_approved = approve WHERE id = rev_id;
    RETURN true;
END;
$$;

-- 9.16 Eliminar Reseña
CREATE OR REPLACE FUNCTION public.kaoj_admin_delete_review(admin_pin TEXT, rev_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.kaoj_verify_admin_pin(admin_pin) THEN
        RAISE EXCEPTION 'PIN de administrador no válido';
    END IF;

    DELETE FROM public.kaoj_reviews WHERE id = rev_id;
    RETURN true;
END;
$$;

-- -------------------------------------------------------------------------
-- 10. STORAGE BUCKET: kaoj-assets (Políticas Seguras de Archivos)
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaoj-assets', 'kaoj-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Acceso público de lectura a kaoj-assets" ON storage.objects;
CREATE POLICY "Acceso público de lectura a kaoj-assets" ON storage.objects 
FOR SELECT USING (bucket_id = 'kaoj-assets');

DROP POLICY IF EXISTS "Permitir subida pública a kaoj-assets" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización en kaoj-assets" ON storage.objects;

-- Permitir subir solo imágenes y documentos PDF con extensiones seguras
CREATE POLICY "Permitir subida pública a kaoj-assets" ON storage.objects 
FOR INSERT WITH CHECK (
    bucket_id = 'kaoj-assets'
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'svg', 'pdf'))
);

-- 11. PRODUCTOS INICIALES DE EJEMPLO (Solo se insertan si no existen, NUNCA borra productos reales)
-- -------------------------------------------------------------------------
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
    'Color y Talla',
    '[{"name": "Champagne - S", "color": "Champagne", "size": "S", "stock": 4}, {"name": "Champagne - M", "color": "Champagne", "size": "M", "stock": 5}, {"name": "Negro - S", "color": "Negro", "size": "S", "stock": 3}, {"name": "Negro - M", "color": "Negro", "size": "M", "stock": 4}]'::jsonb
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
    'Color y Talla',
    '[{"name": "Beige - S", "color": "Beige", "size": "S", "stock": 4}, {"name": "Beige - M", "color": "Beige", "size": "M", "stock": 6}, {"name": "Negro - S", "color": "Negro", "size": "S", "stock": 3}, {"name": "Negro - M", "color": "Negro", "size": "M", "stock": 5}]'::jsonb
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
    'Color y Talla',
    '[{"name": "Rosa Floral - S", "color": "Rosa Floral", "size": "S", "stock": 3}, {"name": "Rosa Floral - M", "color": "Rosa Floral", "size": "M", "stock": 4}, {"name": "Azul Floral - S", "color": "Azul Floral", "size": "S", "stock": 2}, {"name": "Azul Floral - M", "color": "Azul Floral", "size": "M", "stock": 3}]'::jsonb
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
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de IDs
SELECT setval('kaoj_products_id_seq', (SELECT MAX(id) FROM public.kaoj_products));

-- -------------------------------------------------------------------------
-- 12. RESEÑAS INICIALES (SOCIAL PROOF CON FOTOS REALES)
-- -------------------------------------------------------------------------
INSERT INTO public.kaoj_reviews (customer_name, customer_code, rating, comment, photo_url, product_name, is_verified_buyer, is_approved)
VALUES
(
    'Camila Moreira',
    'C3829',
    5,
    '¡El labial Velvet tono Rosa Nude es un sueño! No reseca nada los labios y dura todo el día intacto. Llegó el mismo día a Manta súper bien empacado. 💅💖',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'Labial Líquido Velvet Matte Longwear',
    true,
    true
),
(
    'Valeria Zambrano',
    'V9102',
    5,
    'Me encanta el Gloss Plumper, me dejó los labios con un volumen y brillo natural increíble. Además acumulé puntos VIP con mi código único!',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    'Lip Gloss Plumper Volume & Crystal Shine',
    true,
    true
),
(
    'Alisson Cedeño',
    'A4918',
    5,
    'La blusa satinada en color champagne tiene una tela exquisita y el calce es perfecto. Pagué facilísimo con Deuna y me la entregaron en Portoviejo rapidísimo. 10/10 ✨',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
    'Blusa Satinada Elegance Cuello Halter',
    true,
    true
)
ON CONFLICT DO NOTHING;
