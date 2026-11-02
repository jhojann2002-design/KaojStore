# 💅 KAOJ STORE - E-commerce Boutique con Supabase, PWA y GitHub Pages

Plataforma de comercio electrónico de alta gama para **KAOJ STORE** (Maquillaje, Skincare Dermatológico & Moda Chic). Construida con arquitectura **Zero-Build** lista para **GitHub Pages**, base de datos PostgreSQL en **Supabase**, autenticación con **Google**, **PWA instalable**, pasarela **Payphone Ecuador**, generador de guías **Servientrega**, muro de **Social Proof** y sistema de **Puntos VIP con Código Único de Cliente**.

---

## 🌟 Las 5 Nuevas Funcionalidades Avanzadas

### 1. 💎 Sistema de Puntos y Recompensas con el Código Único
- **Fórmula de Acumulación:** Cada clienta gana **1 Punto Kaoj por cada $1.00 gastado** en compras verificadas.
- **Canje de Descuentos Automático:**
  - Al acumular **50 puntos**, se habilita en el carrito una casilla dorada para canjear **$5.00 de descuento directo** en el total de la orden.
  - La clienta ve su saldo de puntos en vivo en la barra superior y en el checkout.
  - Al completar la compra, los puntos ganados se acreditan a su perfil (`kaoj_customers`) asociados a su `customer_code`.

### 2. 📸 Muro de Reseñas y Fotos de Clientas (Social Proof)
- **Opiniones Reales con Fotos:** Muro estilo carrusel en la página principal con reseñas de 5 estrellas, producto comprado y fotos de clientas luciendo sus labiales o prendas.
- **Modal "Dejar mi Reseña & Foto":** Cualquier clienta puede calificar su producto con estrellas, redactar su opinión y subir una selfie o foto del producto directamente a Supabase Storage (`kaoj-assets/reviews`).
- **Control en Panel Admin:** El administrador puede revisar, aprobar o eliminar opiniones desde la pestaña **"Reseñas"**.

### 3. 💳 Pasarela de Cobro Automática con Tarjeta (Payphone Ecuador)
- Opción de pago con **Tarjeta de Crédito / Débito (Payphone)** junto a Deuna! y Transferencias bancarias.
- Procesamiento de tarjetas Visa, Mastercard, Diners, Discover y bancos nacionales (Pichincha, Guayaquil, Produbanco, etc.).
- **Botón Inteligente de Pago:** Redirige al Deep Link oficial de Payphone con el monto exacto de la orden calculado.
- Configurable desde el panel de administración con el link personal o de comercio de Payphone.

### 4. 📲 PWA (Progressive Web App) Instalable en Móviles
- Archivo [`manifest.json`](./manifest.json) configurado con iconos, colores oficiales de Kaoj Store y modo `standalone`.
- Service Worker [`sw.js`](./sw.js) que almacena en caché local la aplicación para carga instantánea y funcionamiento fluido.
- **Banner de Instalación en 1 Clic:** Detecta navegadores móviles en Android y iOS ofreciendo la instalación de la app directamente en la pantalla de inicio del teléfono celular.

### 5. 📦 Generador de Etiquetas de Envío para Servientrega
- En el panel de **Administración -> Pedidos**, cada orden cuenta con el botón **"📦 Guía Servientrega"**.
- Genera en pantalla una **etiqueta de envío oficial de Servientrega** con:
  - Logotipo y formato oficial de Guía Nacional.
  - **Código de barras interactivo** generado con el código de orden (ej. `*KAOJ-123456*`).
  - Datos del remitente: KAOJ STORE (Portoviejo / Manta - Manabí, RUC y teléfono).
  - Datos completos de la clienta: Nombre, Cédula/RUC, Celular, Dirección exacta y Código Único VIP.
  - Desglose del contenido declarado (cosméticos/ropa) y valor total.
  - Estilos de impresión `@media print`: Presiona **"🖨️ Imprimir Guía"** para imprimir directamente en papel adhesivo térmico (10x15 cm) o en hojas A4 sin elementos extra de la página web.

---

## 🏷️ ¿Cómo funciona el Código Único de Cliente?

$$\text{Código VIP} = \text{1ª Letra del Nombre (Mayúscula)} + \text{Últimos 4 dígitos del Celular}$$

- *Ejemplo:* **Jhojann** con celular **0991234567** $\rightarrow$ **`J4567`**.
- Se autocalcula en tiempo real conforme la clienta escribe sus datos.
- Permite rastrear pedidos pasados, acumular puntos de fidelidad y se envía en el mensaje automático de WhatsApp para atención inmediata.

---

## 🚀 Despliegue en GitHub Pages (Zero-Build)

1. En la carpeta del proyecto, sube los cambios a tu repositorio de GitHub:
   ```bash
   git add .
   git commit -m "feat: Integrar PWA, Payphone, Servientrega, Reseñas y Puntos VIP"
   git push origin main
   ```
2. En GitHub ve a **Settings** -> **Pages**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `(root)`
   - Haz clic en **Save**. En un par de minutos estará online en:
     `https://TU_USUARIO.github.io/kaoj-store/`

---

## 🗄️ Actualización de Base de Datos en Supabase (Seguridad Blindada)

1. Abre tu panel en [supabase.com](https://supabase.com) -> **SQL Editor**.
2. Copia todo el contenido de [`supabase_schema.sql`](./supabase_schema.sql) y haz clic en **Run**.
3. El script creará y configurará automáticamente:
   - **Políticas RLS estrictas:** Bloqueo de accesos no autorizados a pedidos, clientes y ajustes.
   - **PIN Administrativo Seguro con Bcrypt:** Almacenado en `kaoj_admin_auth` con hash criptográfico (nunca expuesto al público).
   - **Funciones PostgreSQL `SECURITY DEFINER`:** Gestión atómica de pedidos, inventario, clientes y ajustes.
   - **Protección contra colisión de Códigos VIP:** Los clientes se anclan por número de celular único.
   - **Rastreo seguro:** Los pedidos se consultan mediante función protegida sin exponer datos de otras clientas.

---

## 🔐 Panel de Control de Administración Protegido

- Botón **"⚙️ Admin"** en la barra superior o en el pie de página.
- **PIN por defecto:** `2026` (verificado en el servidor mediante hash Bcrypt; modificable en la pestaña de Ajustes).
- **Pestañas disponibles:**
  - **📊 Métricas:** Ventas realizadas, pedidos por despachar, clientas registradas y alertas de stock bajo.
  - **📦 Inventario:** Creación de productos, fotos en la nube y control de existencias en tiempo real (+ / -).
  - **🏷️ Secciones:** Administrador dinámico de departamentos y subcategorías.
  - **🛍️ Pedidos:** Cambio de estado (`Pendiente`, `Verificado`, `En Camino`, `Entregado`), botón de **Guía Servientrega** imprimible, reversión atómica de ventas y notificación a la clienta por WhatsApp.
  - **📸 Reseñas:** Moderación de opiniones y fotos compartidas por compradoras.
  - **💎 Clientes VIP:** Directorio con código único, celular, total comprado y puntos acumulados.
  - **⚙️ Ajustes:** Link de Payphone, WhatsApp, Deuna QR, cuentas bancarias y cambio de PIN de seguridad.
