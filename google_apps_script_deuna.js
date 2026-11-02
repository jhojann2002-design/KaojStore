/**
 * =========================================================================
 * KAOJ STORE - AUTOMATIZACIÓN DE PAGOS DEUNA! VÍA GMAIL
 * =========================================================================
 * 
 * Cuenta destinataria: alisson.kandy2002@gmail.com
 * Remitente de Deuna: notificaciones@deunaapp.com
 * Endpoint Supabase: https://uxptcckcwcyaivurhxzh.supabase.co
 * 
 * INSTRUCCIONES DE INSTALACIÓN (EN 2 MINUTOS):
 * 1. Abre https://script.google.com con la cuenta alisson.kandy2002@gmail.com
 * 2. Haz clic en "Nuevo proyecto" y ponle de nombre: "Kaoj DeUna Verificador"
 * 3. Borra todo el código que aparezca y pega este archivo completo.
 * 4. Arriba en la barra selecciona la función: "instalarDisparadorAutomatico" y dale al botón "Ejecutar".
 * 5. Google te pedirá permisos para leer correos de Gmail; dale "Revisar permisos" > "Avanzado" > "Ir a Kaoj DeUna Verificador (no seguro)" > "Permitir".
 * 
 * ¡Listo! A partir de ese momento, cada vez que llegue un pago de DeUna, se verificará
 * automáticamente en tu tienda en menos de 60 segundos.
 */

var SUPABASE_URL = "https://uxptcckcwcyaivurhxzh.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHRjY2tjd2N5YWl2dXJoeHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NjY1NDgsImV4cCI6MjEwOTE0MjU0OH0.8Br_I5FuqHBdNM5GzlITJ-d8AS_6kbvuruMqYjLMo4A";

/**
 * Función principal que se ejecuta automáticamente cada minuto.
 */
function procesarPagosDeuna() {
  var query = 'from:notificaciones@deunaapp.com is:unread';
  var threads = GmailApp.search(query, 0, 15);
  
  if (!threads || threads.length === 0) {
    Logger.log('No hay nuevos correos de Deuna pendientes.');
    return;
  }

  var labelName = 'Kaoj/Deuna_Verificado';
  var label = obtenerOCrearEtiqueta(labelName);

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();

    for (var j = 0; j < messages.length; j++) {
      var msg = messages[j];
      if (msg.isUnread()) {
        var body = msg.getPlainBody() || msg.getBody();
        var parsed = parsearCorreoDeuna(body);

        if (parsed && parsed.transactionId && parsed.amount > 0) {
          Logger.log('Detectado pago Deuna: Tx #' + parsed.transactionId + ' | Monto: $' + parsed.amount + ' | Emisor: ' + parsed.senderName);
          
          var success = registrarPagoEnSupabase(parsed, body);
          if (success) {
            msg.markRead();
            if (label) thread.addLabel(label);
            Logger.log('✓ Pago Tx #' + parsed.transactionId + ' registrado y marcado como leído.');
          }
        } else {
          Logger.log('Mensaje no coincide con formato de pago Deuna recibido.');
        }
      }
    }
  }
}

/**
 * Extrae con precisión los datos de la notificación de Deuna.
 */
function parsearCorreoDeuna(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Número de transacción (12 dígitos numéricos)
  var txMatch = rawText.match(/(?:n[uú]mero\s+de\s+transacci[oó]n|transacci[oó]n|nro\s+tx)\s*[:\t ]*([0-9]{8,18})/i) ||
                rawText.match(/\b([0-9]{12})\b/);
  
  // 2. Monto en USD (soporta formato $35,00 o $35.00)
  var amountMatch = rawText.match(/(?:monto\s*[:\t ]*|recibiste\s*)\$?([0-9]+(?:[.,][0-9]{2})?)/i);

  // 3. Nombre del ordenante / Emisor
  var senderMatch = rawText.match(/nombre\s+del\s+ordenante\s*[:\t ]*([^\n\r]+)/i);
  if (!senderMatch) {
    senderMatch = rawText.match(/recibiste\s+\$?[0-9.,]+\s+de\s*\n?\s*([^\n\r]+?)(?:\s+con\s+deuna|\n|$)/i);
  }

  // 4. Cuentas y fecha
  var destMatch = rawText.match(/cuenta\s+de\s+destino\s*[:\t ]*([^\n\r]+)/i);
  var origMatch = rawText.match(/cuenta\s+de\s+origen\s*[:\t ]*([^\n\r]+)/i);
  var dateMatch = rawText.match(/fecha\s*[:\t ]*([^\n\r]+)/i);

  var transactionId = txMatch ? txMatch[1].trim() : '';
  var amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
  var senderName = senderMatch ? senderMatch[1].trim() : '';
  var destAccount = destMatch ? destMatch[1].trim() : '';
  var origAccount = origMatch ? origMatch[1].trim() : '';
  var paymentDate = dateMatch ? dateMatch[1].trim() : '';

  if (!transactionId || amount <= 0) {
    return null;
  }

  return {
    transactionId: transactionId,
    amount: amount,
    senderName: senderName,
    destAccount: destAccount,
    origAccount: origAccount,
    paymentDate: paymentDate
  };
}

/**
 * Envía los datos del pago a Supabase RPC
 */
function registrarPagoEnSupabase(parsed, rawBody) {
  var endpoint = SUPABASE_URL + '/rest/v1/rpc/kaoj_register_deuna_payment';
  
  var payload = {
    p_tx_id: parsed.transactionId,
    p_amount: parsed.amount,
    p_sender: parsed.senderName || '',
    p_orig_acc: parsed.origAccount || '',
    p_dest_acc: parsed.destAccount || '',
    p_payment_date: parsed.paymentDate || '',
    p_raw_email: (rawBody || '').substring(0, 1000)
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(endpoint, options);
    var code = response.getResponseCode();
    var respText = response.getContentText();
    Logger.log('Supabase [' + code + ']: ' + respText);
    return code >= 200 && code < 300;
  } catch (e) {
    Logger.log('Error conectando con Supabase: ' + e);
    return false;
  }
}

/**
 * Obtiene o crea una etiqueta en Gmail para organizar
 */
function obtenerOCrearEtiqueta(nombre) {
  try {
    return GmailApp.getUserLabelByName(nombre) || GmailApp.createLabel(nombre);
  } catch (e) {
    return null;
  }
}

/**
 * EJECUTA ESTA FUNCIÓN UNA SOLA VEZ para activar el cron de 1 minuto automáticamente.
 */
function instalarDisparadorAutomatico() {
  // Eliminar disparadores anteriores para evitar duplicados
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'procesarPagosDeuna') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Crear disparador cada 1 minuto
  ScriptApp.newTrigger('procesarPagosDeuna')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('🎉 ¡Disparador instalado con éxito! Revisará correos de Deuna cada 1 minuto.');
}
