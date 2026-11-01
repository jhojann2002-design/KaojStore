# 💅 KAOJ STORE - E-commerce Boutique con Supabase y GitHub Pages

Plataforma de comercio electrónico moderna, rápida y elegante para **KAOJ STORE** (Maquillaje, Skincare & Moda). Diseñada con arquitectura **Zero-Build**, 100% compatible con **GitHub Pages**, conectada a **Supabase** (Base de Datos PostgreSQL, Autenticación con Google y Storage de Comprobantes) y con sistema de **Código Único de Cliente**.

---

## 🌟 Características Principales

1. **🏷️ Código Único de Cliente VIP:**
   - Generación automática en vivo basada en la fórmula: **1ª Letra del Nombre (Mayúscula) + Últimos 4 dígitos del Celular**.
   - *Ejemplo:* Si el cliente se llama **Jhojann** y su número es **0991234567**, su código único es **`J4567`**.
   - Vinculado al historial de pedidos, base de datos y mensaje de WhatsApp para fidelización.
   - **Módulo de Rastreo de Pedidos:** Cualquier clienta puede ingresar su código único (ej. `J4567`) para ver el estado de sus pedidos en tiempo real (`Pendiente`, `Verificado`, `En Camino`, `Entregado`).

2. **📦 Inventario y Pedidos en Base de Datos Supabase:**
   - Catálogo administrado en tiempo real mediante la tabla `kaoj_products`.
   - Soporte para **variantes con control de stock individual** (tonos, tallas, medidas) y alerta de stock bajo.
   - Ajuste rápido de stock con botones `+` y `-` en vivo desde el panel de control.
   - Historial de pedidos con registro de cliente, entrega, método de pago, comprobante y selector de estado.
   - Notificación de estado automatizada al cliente vía WhatsApp con un solo clic.

3. **🔐 Iniciar Sesión con Google y Carritos Persistentes:**
   - Inicio de sesión con un clic usando **Google OAuth** mediante Supabase Auth.
   - **Sincronización en la Nube:** El carrito de compras se guarda en la tabla `kaoj_carts`. Si la clienta cambia de dispositivo (del celular a la laptop o tablet) o recarga la página, su carrito se mantiene intacto.
   - Autocompletado del nombre y correo del cliente al iniciar sesión.

4. **💳 Métodos de Pago y Comprobantes:**
   - **Deuna!:** Deep-link directo para abrir la app oficial en el celular y visualización del código QR.
   - **Transferencia Bancaria:** Cuentas de Banco Guayaquil y Banco Pichincha con botones interactivos para copiar el número de cuenta al portapapeles con un clic.
   - **Carga de Comprobantes:** Subida directa de imágenes/capturas a Supabase Storage (`kaoj-assets/receipts`) con previsualización en vivo.

5. **⚡ Listo para GitHub Pages (Zero-Build):**
   - Sin necesidad de instalar Node.js ni compilar paquetes pesados. Funciona directamente en cualquier navegador y se despliega en segundos.

---

## 📁 Estructura del Repositorio

```text
Kaoj Store Ecommerce/
├── index.html            # Aplicación web completa (React 18 + Tailwind CSS + Supabase Client)
├── supabase_schema.sql   # Script SQL con tablas, índices, políticas RLS, storage y datos semilla
├── .gitignore            # Archivos ignorados por Git
└── README.md             # Guía completa de instalación, despliegue y administración
```

---

## 🚀 Paso a Paso: Subir a GitHub y Desplegar en GitHub Pages

### 1. Inicializar Git y Crear el Repositorio

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
# Inicializar repositorio local
git init

# Agregar todos los archivos
git add .

# Hacer el commit inicial
git commit -m "feat: Lanzamiento Kaoj Store E-commerce con Supabase y Google Auth"

# Cambiar la rama a main
git branch -M main
```

### 2. Conectar con tu Repositorio en GitHub

1. Entra a [GitHub.com](https://github.com) y crea un nuevo repositorio (por ejemplo: `kaoj-store`).
2. Copia la URL del repositorio y ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/kaoj-store.git
git push -u origin main
```

### 3. Activar GitHub Pages (¡En 2 Clics!)

1. En tu repositorio de GitHub, ve a **Settings** (Configuración) -> pestaña **Pages** (en el menú lateral izquierdo).
2. En la sección **Build and deployment**:
   - **Source:** Selecciona `Deploy from a branch`.
   - **Branch:** Selecciona `main` y la carpeta `/ (root)`.
3. Haz clic en **Save** (Guardar).
4. Espera 1 minuto y tu tienda estará en línea en:
   `https://TU_USUARIO.github.io/kaoj-store/`

---

## 🗄️ Configuración de Supabase (Paso a Paso)

### 1. Crear tu Proyecto en Supabase
1. Ingresa a [supabase.com](https://supabase.com) y crea un nuevo proyecto gratuito (por ejemplo, `kaoj-store-db`).
2. Guarda la contraseña de la base de datos y selecciona la región más cercana (ej. `us-east-1`).

### 2. Ejecutar el Script SQL
1. En tu panel de Supabase, ve al menú lateral izquierdo y haz clic en **SQL Editor** (Editor SQL).
2. Haz clic en **New Query** (Nueva consulta).
3. Abre el archivo [`supabase_schema.sql`](./supabase_schema.sql) de este repositorio, copia todo su contenido, pégalo en el editor y presiona **Run** (Ejecutar).
4. Esto creará automáticamente:
   - Tabla `kaoj_products` (con 6 productos iniciales listos para vender).
   - Tabla `kaoj_settings` (con datos de Deuna, WhatsApp y bancos).
   - Tabla `kaoj_orders` (con código único de cliente y estados de entrega).
   - Tabla `kaoj_carts` (para sincronizar carritos con Google).
   - Tabla `kaoj_customers` (para perfiles VIP).
   - Bucket de almacenamiento público `kaoj-assets` para fotos y comprobantes.
   - Todas las políticas de seguridad (Row Level Security).

### 3. Obtener tus Credenciales de Supabase
1. En Supabase, ve a **Project Settings** (el icono de engranaje abajo a la izquierda) -> **API**.
2. Copia:
   - **Project URL** (ej: `https://xyzabc123.supabase.co`)
   - **Project API Keys:** La clave `anon` / `public`.
3. Puedes pegarlas directamente en la tienda abriendo la web y haciendo clic en **"⚙️ Configuración Supabase"** en el pie de página o en el panel de Admin. Se guardarán en el navegador de inmediato.

---

## 🔑 Activar Inicio de Sesión con Google (Google OAuth)

Para que tus clientas puedan iniciar sesión con Google y sincronizar sus carritos:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto y ve a **APIs & Services** -> **Credentials**.
3. Configura la **OAuth Consent Screen** (Pantalla de consentimiento) como Externa con el nombre "KAOJ STORE".
4. Crea unas credenciales de tipo **OAuth 2.0 Client ID**:
   - **Application Type:** Web Application.
   - **Authorized redirect URIs:** Añade la URL que te da Supabase en:
     *Supabase Dashboard -> Authentication -> Providers -> Google -> Callback URL (for OAuth)*.
5. Copia el **Client ID** y **Client Secret** generados por Google.
6. En Supabase, ve a **Authentication** -> **Providers** -> activa **Google**, pega el Client ID y Secret, y guarda.
7. En Supabase -> **Authentication** -> **URL Configuration**:
   - En **Site URL** pon la URL de tu GitHub Pages: `https://TU_USUARIO.github.io/kaoj-store/`
   - En **Redirect URLs** añade: `https://TU_USUARIO.github.io/kaoj-store/*` y `http://localhost:*`

---

## 👩‍💼 Uso del Panel de Administrador

- Para ingresar, haz clic en **"⚙️ Admin"** en el menú superior.
- **PIN por defecto:** `2026` (puedes cambiarlo en la pestaña de Ajustes).
- **Funcionalidades:**
  - **Inventario:** Sube fotos, crea productos con precios de oferta y gestiona stock de variantes (+ / -).
  - **Pedidos:** Visualiza comprobantes en tamaño completo, cambia el estado (`Pendiente` -> `Verificado` -> `En Camino` -> `Entregado`) y envía una notificación automática por WhatsApp a la clienta con un botón.
  - **Configuración:** Actualiza el número de WhatsApp receptor, tu QR de Deuna! y números de cuenta bancaria.

---

## 💡 Recomendaciones de Mejoras Futuras para KAOJ STORE

1. **Programa de Puntos y Fidelidad con el Código Único:**
   - Aprovechando el `customer_code`, acumular puntos por cada dólar comprado (ej. 100 puntos = $5 de descuento en el siguiente pedido).
2. **Reseñas y Fotos de Clientas:**
   - Permitir a las clientas subir fotos luciendo los labiales o blusas recibidas, aumentando la prueba social (*Social Proof*).
3. **Generador de Enlaces de Pago Automáticos:**
   - Integración con pasarelas de cobro con tarjeta de crédito/débito nacional e internacional (Payphone Ecuador, Kushki o Stripe).
4. **Notificaciones Push / PWA (Progressive Web App):**
   - Convertir la web en una aplicación instalable en el celular de las clientas para enviar alertas de ofertas flash y descuentos de temporada.
5. **Cálculo Dinámico de Envíos con Geolocalización:**
   - Integración con APIs de mapas o tarifas por cantón (Manta, Portoviejo, Chone, Guayaquil, Quito, etc.).
