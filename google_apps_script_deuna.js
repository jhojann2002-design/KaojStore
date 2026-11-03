/**
 * =========================================================================
 * KAOJ STORE - AUTOMATIZACIÓN DE PAGOS DEUNA! VÍA GMAIL
 * =========================================================================
 * 
 * Cuenta destinataria: alisson.kandy2002@gmail.com
 * Cuenta bancaria destino: ******0164 (Kaoj Store)
 * Remitente oficial de Deuna: notificaciones@deunaapp.com
 * Endpoint Supabase: https://uxptcckcwcyaivurhxzh.supabase.co
 * 
 * FILTRADO ESTRICTO DE SEGURIDAD:
 * Solo procesa dinero ENTRANTE recibido de clientas ("Recibiste $XX de [Cliente]").
 * Descarta y descarta automáticamente pagos salientes que tú realices ("Pagaste").
 * 
 * INSTRUCCIONES DE INSTALACIÓN (EN 2 MINUTOS):
 * 1. Abre https://script.google.com con la cuenta alisson.kandy2002@gmail.com
 * 2. Abre tu proyecto "Kaoj DeUna Verificador" (o crea uno nuevo).
 * 3. Reemplaza todo el código por este archivo completo y presiona "Guardar" (Ctrl+S / Cmd+S).
 * 4. Si quieres importar pagos de días anteriores, selecciona arriba la función:
 *    "sincronizarHistoricoDeuna" y dale al botón "Ejecutar".
 * 5. Selecciona la función "instalarDisparadorAutomatico" y dale "Ejecutar"
 *    para que revise correos nuevos automáticamente cada 30 segundos (2 veces por minuto).
 */

var SUPABASE_URL = "https://uxptcckcwcyaivurhxzh.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4cHRjY2tjd2N5YWl2dXJoeHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NjY1NDgsImV4cCI6MjEwOTE0MjU0OH0.8Br_I5FuqHBdNM5GzlITJ-d8AS_6kbvuruMqYjLMo4A";

/**
 * Función principal que se ejecuta automáticamente cada minuto.
 * Solo procesa correos NO LEÍDOS de dinero recibido ("Recibiste").
 */
function procesarPagosDeuna() {
  // Búsqueda instantánea de correos no leídos de Deuna
  var query = 'from:notificaciones@deunaapp.com is:unread';
  var threads = GmailApp.search(query, 0, 15);
  
  if (!threads || threads.length === 0) {
    return;
  }

  var labelName = 'Kaoj/Deuna_Verificado';
  var label = obtenerOCrearEtiqueta(labelName);

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();

    // Recorrer SIEMPRE del más reciente al más antiguo
    for (var j = messages.length - 1; j >= 0; j--) {
      var msg = messages[j];
      if (msg.isUnread()) {
        var body = msg.getPlainBody() || msg.getBody();
        var parsed = parsearCorreoDeuna(body);

        if (parsed && parsed.transactionId && parsed.amount > 0) {
          Logger.log('Detectado pago recibido Deuna: Tx #' + parsed.transactionId + ' | Monto: $' + parsed.amount + ' | Emisor: ' + parsed.senderName);
          
          var success = registrarPagoEnSupabase(parsed, body);
          if (success) {
            msg.markRead();
            if (label) thread.addLabel(label);
            Logger.log('✓ Pago entrante Tx #' + parsed.transactionId + ' registrado y marcado como verificado.');
          }
        } else {
          // Si es un pago saliente ('Pagaste') o no es cobro, marcar como leído para no repetir el escaneo
          msg.markRead();
        }
      }
    }
  }
}

/**
 * Extrae con máxima precisión los datos de la notificación de dinero recibido de Deuna.
 * Rechaza estrictamente cualquier pago saliente ("Pagaste" o cuenta origen ******0164).
 */
function parsearCorreoDeuna(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. REGLA ESTRICTA ANTI-PAGOS SALIENTES:
  // Si contiene "Pagaste", "Nombre del beneficiario" o la cuenta de origen es la de Alisson (0164),
  // descartar de inmediato porque es un pago que tú hiciste a otro comercio/persona.
  if (/pagaste\s+\$/i.test(rawText) || /pagaste\s+a\b/i.test(rawText) || /nombre\s+del\s+beneficiario/i.test(rawText)) {
    Logger.log('Ignorado: Es un comprobante de pago saliente ("Pagaste").');
    return null;
  }

  var origMatch = rawText.match(/cuenta\s+de\s+origen\s*[:\t ]*([^\n\r]+)/i);
  var origAccount = origMatch ? origMatch[1].trim() : '';
  if (origAccount.indexOf('0164') !== -1) {
    Logger.log('Ignorado: La cuenta de origen es la propia cuenta titular (0164).');
    return null;
  }

  // 2. REGLA DE PAGOS ENTRANTES:
  // Debe contener explícitamente "Recibiste" o "Nombre del ordenante"
  if (!/recibiste/i.test(rawText) && !/nombre\s+del\s+ordenante/i.test(rawText)) {
    Logger.log('Ignorado: No contiene indicadores de cobro recibido.');
    return null;
  }

  // 3. Número de transacción DeUna (10 a 18 dígitos, habitualmente 12)
  var txMatch = rawText.match(/(?:n[uú]mero\s+de\s+transacci[oó]n|transacci[oó]n|nro\s+tx)\s*[:\t ]*([0-9]{8,18})/i) ||
                rawText.match(/\b([0-9]{12})\b/);
  
  // 4. Monto recibido en USD (soporta formato $35,00 o $35.00)
  var amountMatch = rawText.match(/(?:monto\s*[:\t ]*|recibiste\s*)\$?([0-9]+(?:[.,][0-9]{2})?)/i);

  // 5. Nombre del ordenante / Emisor (la clienta que pagó)
  var senderMatch = rawText.match(/nombre\s+del\s+ordenante\s*[:\t ]*([^\n\r]+)/i);
  if (!senderMatch) {
    senderMatch = rawText.match(/recibiste\s+\$?[0-9.,]+\s+de\s*\n?\s*([^\n\r]+?)(?:\s+con\s+deuna|\n|$)/i);
  }

  // 6. Cuentas y fecha
  var destMatch = rawText.match(/cuenta\s+de\s+destino\s*[:\t ]*([^\n\r]+)/i);
  var dateMatch = rawText.match(/fecha\s*[:\t ]*([^\n\r]+)/i);

  var transactionId = txMatch ? txMatch[1].trim() : '';
  var amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
  var senderName = senderMatch ? senderMatch[1].trim() : '';
  var destAccount = destMatch ? destMatch[1].trim() : '';
  var paymentDate = dateMatch ? dateMatch[1].trim() : '';

  // 7. Validación de cuenta de destino: si viene especificada, debe corresponder a la cuenta de la tienda (0164)
  if (destAccount && destAccount.indexOf('0164') === -1) {
    Logger.log('Ignorado: La cuenta de destino (' + destAccount + ') no es la cuenta de Kaoj Store (0164).');
    return null;
  }

  if (!transactionId || amount <= 0) {
    return null;
  }

  return {
    transactionId: transactionId,
    amount: amount,
    senderName: senderName,
    destAccount: destAccount || '******0164',
    origAccount: origAccount,
    paymentDate: paymentDate
  };
}

/**
 * Envía los datos del pago recibido a Supabase RPC
 */
function registrarPagoEnSupabase(parsed, rawBody) {
  var endpoint = SUPABASE_URL + '/rest/v1/rpc/kaoj_register_deuna_payment';
  
  var payload = {
    p_tx_id: parsed.transactionId,
    p_amount: parsed.amount,
    p_sender: parsed.senderName || '',
    p_orig_acc: parsed.origAccount || '',
    p_dest_acc: parsed.destAccount || '******0164',
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
 * IMPORTAR HISTORIAL DE PAGOS RECIBIDOS (Prioriza los más recientes)
 * Ejecuta esta función manualmente desde el editor de Google Apps Script
 * si deseas importar pagos recibidos en los últimos días que ya fueron leídos.
 */
function sincronizarHistoricoDeuna() {
  var query = 'from:notificaciones@deunaapp.com newer_than:30d';
  var threads = GmailApp.search(query, 0, 50);
  Logger.log('Analizando ' + threads.length + ' conversaciones de DeUna...');

  var importados = 0;
  var label = obtenerOCrearEtiqueta('Kaoj/Deuna_Verificado');

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    // Siempre del MÁS RECIENTE al más antiguo
    for (var j = messages.length - 1; j >= 0; j--) {
      var msg = messages[j];
      var body = msg.getPlainBody() || msg.getBody();
      var parsed = parsearCorreoDeuna(body);
      if (parsed && parsed.transactionId && parsed.amount > 0) {
        var ok = registrarPagoEnSupabase(parsed, body);
        if (ok) {
          importados++;
          if (label) threads[i].addLabel(label);
        }
      }
    }
  }
  Logger.log('🎉 Sincronización finalizada. Se procesaron ' + importados + ' pagos recibidos.');
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
 * CICLO DE ALTA VELOCIDAD: REVISA CADA 30 SEGUNDOS (2 veces por minuto)
 * Ejecuta una revisión en el segundo 0 y otra en el segundo 30.
 * Utiliza LockService para garantizar que las revisiones no se superpongan.
 */
function cicloVerificacionDeuna() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(3000)) {
    Logger.log('Ciclo anterior aún activo. Esperando el siguiente turno...');
    return;
  }

  try {
    // 1ª Revisión (Segundo 0)
    procesarPagosDeuna();

    // Pausa activa de 30 segundos
    Utilities.sleep(30000);

    // 2ª Revisión (Segundo 30)
    procesarPagosDeuna();
  } catch (err) {
    Logger.log('Error en ciclo de 30 segundos: ' + err);
  } finally {
    lock.releaseLock();
  }
}

/**
 * EJECUTA ESTA FUNCIÓN UNA SOLA VEZ para activar el disparador automático.
 * Configurará revisiones cada 30 segundos de forma continua y desatendida.
 */
function instalarDisparadorAutomatico() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'procesarPagosDeuna' || fn === 'cicloVerificacionDeuna') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Activa el ciclo cada 1 minuto (que internamente ejecuta 2 revisiones cada 30s)
  ScriptApp.newTrigger('cicloVerificacionDeuna')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('🎉 ¡Disparador de 30 segundos instalado con éxito! Revisará correos entrantes dos veces por minuto.');
}
