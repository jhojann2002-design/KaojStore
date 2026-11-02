/**
 * ============================================================================
 * KAOJ STORE BOUTIQUE - VALIDADOR AUTOMÁTICO DE PAGOS POR CORREO (GMAIL)
 * Correo oficial receptor: kaoj.store.ecu@gmail.com
 * Compatible con: Banco Pichincha, Deuna!, Banco Guayaquil, Produbanco, Pacífico
 * ============================================================================
 *
 * ¿CÓMO INSTALARLO EN 2 MINUTOS (100% GRATIS)?
 * 1. Inicia sesión en Google con el correo de la tienda: kaoj.store.ecu@gmail.com
 * 2. Entra a: https://script.google.com y haz clic en "Nuevo proyecto"
 * 3. Borra el código que sale por defecto y pega TODO este archivo.
 * 4. Haz clic en el ícono de Guardar (💾) arriba y ponle de nombre "Validador Pagos Kaoj".
 * 5. En el menú de la izquierda, haz clic en el ícono del Reloj ⏰ ("Activadores" / "Triggers").
 * 6. Haz clic abajo a la derecha en "+ Añadir activador" (Add Trigger) y configúralo así:
 *    - Función que se ejecutará: validarPagosPendientesKaoj
 *    - Fuente del evento: Según el tiempo (Time-driven)
 *    - Tipo de activador: Temporizador por minutos (Minutes timer)
 *    - Intervalo de minutos: Cada minuto (Every minute) o Cada 5 minutos
 * 7. Guarda y acepta los permisos de lectura de Gmail. ¡Listo!
 *
 * TIP PARA TU CUENTA DE BANCO PICHINCHA (2215807440) Y DEUNA!:
 * - Si los correos de Banco Pichincha o Deuna te llegan a tu correo personal en lugar
 *   de kaoj.store.ecu@gmail.com, entra a tu Gmail personal -> Configuración ->
 *   "Filtros y direcciones bloqueadas" -> "Crear un filtro":
 *   En "De" escribe: pichincha.com OR deuna OR bancoguayaquil.com
 *   Y marca: "Reenviar a: kaoj.store.ecu@gmail.com".
 * - Además, en la tienda web ya quedó puesto el aviso obligatorio con botón de
 *   "Copiar Correo" para que las clientas pongan kaoj.store.ecu@gmail.com al transferir.
 * ============================================================================
 */

const SUPABASE_URL = 'https://uxptcckcwcyaivurhxzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHRjY2tjd2N5YWl2dXJoeHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NjY1NDgsImV4cCI6MjEwOTE0MjU0OH0.8Br_I5FuqHBdNM5GzlITJ-d8AS_6kbvuruMqYjLMo4A';
const ADMIN_PIN = '2026'; // O tu PIN personalizado de administrador

const LABEL_PROCESSED = 'KAOJ_VALIDADO';

function validarPagosPendientesKaoj() {
  // Crear o recuperar etiqueta para no procesar el mismo correo dos veces
  let label = GmailApp.getUserLabelByName(LABEL_PROCESSED);
  if (!label) {
    label = GmailApp.createLabel(LABEL_PROCESSED);
  }

  // Buscar correos bancarios de los últimos 2 días que aún no tengan la etiqueta KAOJ_VALIDADO
  const searchQuery = 'newer_than:2d -label:' + LABEL_PROCESSED + ' (transferencia OR acreditacion OR acreditación OR comprobante OR deuna OR pichincha OR guayaquil OR produbanco OR pacifico OR "pago recibido")';
  const threads = GmailApp.search(searchQuery, 0, 25);

  if (!threads || threads.length === 0) {
    Logger.log('No hay correos bancarios nuevos por procesar.');
    return;
  }

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    let threadMatched = false;

    for (let j = 0; j < messages.length; j++) {
      const msg = messages[j];
      const subject = msg.getSubject() || '';
      const from = msg.getFrom() || '';
      const plainBody = msg.getPlainBody() || '';
      const htmlBody = msg.getBody() || '';
      const cleanText = (subject + ' \n ' + plainBody + ' \n ' + htmlBody.replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ');

      // 1. Detectar entidad bancaria
      let bankSource = 'Transferencia Bancaria';
      if (/deuna/i.test(cleanText) || /deuna/i.test(from)) {
        bankSource = 'Deuna! (Banco Pichincha)';
      } else if (/pichincha/i.test(cleanText) || /pichincha/i.test(from)) {
        bankSource = 'Banco Pichincha';
      } else if (/guayaquil/i.test(cleanText) || /guayaquil/i.test(from)) {
        bankSource = 'Banco Guayaquil';
      } else if (/produbanco/i.test(cleanText)) {
        bankSource = 'Produbanco';
      } else if (/pac[ií]fico/i.test(cleanText)) {
        bankSource = 'Banco del Pacífico';
      }

      // 2. Extraer el monto en dólares ($XX.XX o USD XX.XX)
      const amount = extractPaymentAmount(cleanText);
      // 3. Extraer el Número de Comprobante / Documento / Referencia
      const reference = extractPaymentReference(cleanText);

      Logger.log('Analizando correo: [' + subject + '] | Banco: ' + bankSource + ' | Monto: ' + amount + ' | Comprobante: ' + reference);

      if (amount !== null && amount > 0) {
        const result = callSupabaseAutoVerify(amount, reference || '', bankSource, subject);
        Logger.log('Resultado Supabase: ' + JSON.stringify(result));

        if (result && result.matched === true) {
          threadMatched = true;
          msg.markRead();
        }
      }
    }

    // Si el correo correspondió y validó un pedido (o tiene más de 12 horas sin coincidir), etiquetarlo
    if (threadMatched) {
      thread.addLabel(label);
    }
  }
}

/**
 * Extrae el monto en USD desde los formatos de Banco Pichincha, Deuna y Banco Guayaquil
 */
function extractPaymentAmount(text) {
  const patterns = [
    /(?:monto|valor|importe|total|pagaste|recibiste|acreditado|transferencia\s+por)[^0-9$]{0,25}(?:USD|\$)\s*([0-9]{1,4}(?:[.,][0-9]{2}))/i,
    /(?:USD|\$)\s*([0-9]{1,4}(?:[.,][0-9]{2}))/i,
    /(?:monto|valor|importe)\s*:?\s*([0-9]{1,4}[.,][0-9]{2})\s*(?:USD|d[oó]lares)?/i
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match && match[1]) {
      const normalized = match[1].replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num) && num > 0 && num < 5000) {
        return num;
      }
    }
  }
  return null;
}

/**
 * Extrae el número de documento/comprobante de los correos bancarios ecuatorianos
 */
function extractPaymentReference(text) {
  const patterns = [
    /(?:comprobante|documento|referencia|transacci[oó]n|autorizaci[oó]n|secuencial|nro\.?|n[uú]mero)\s*(?:no\.?|nro\.?|#|:)?\s*([0-9]{5,15})/i,
    /\bKAOJ-[0-9]{6}\b/i
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match && match[1]) {
      return match[1].trim();
    } else if (match && match[0]) {
      return match[0].trim();
    }
  }
  return '';
}

/**
 * Llama a la función RPC segura de Supabase para verificar automáticamente la orden pendiente
 */
function callSupabaseAutoVerify(amount, reference, bankSource, rawDetails) {
  const url = SUPABASE_URL + '/rest/v1/rpc/kaoj_auto_verify_payment_from_email';
  const payload = {
    admin_pin: ADMIN_PIN,
    payment_amount: amount,
    payment_ref: reference,
    bank_source: bankSource,
    raw_details: rawDetails
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const body = response.getContentText();
    if (statusCode >= 200 && statusCode < 300 && body) {
      return JSON.parse(body);
    }
    Logger.log('Error HTTP Supabase (' + statusCode + '): ' + body);
  } catch (err) {
    Logger.log('Excepción llamando a Supabase: ' + err.toString());
  }
  return null;
}
