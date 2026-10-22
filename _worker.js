export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cf = request.cf || {};
    
    // 1. Obtener datos del visitante
    const country = cf.country || "Desconocido";
    const city = cf.city || "Desconocido";
    const region = cf.region || "Desconocido";
    const ip = request.headers.get("CF-Connecting-IP") || "Desconocido";
    const userAgent = request.headers.get("User-Agent") || "Desconocido";

    // 2. Excluir rastreadores de motores de búsqueda (Googlebot, etc.) y clics de Ads
    const isBot = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(userAgent);
    const isAdClick = url.searchParams.has("gclid"); // Protege tu cuenta de Google Ads
    
    // 3. Redirección: Visitantes de EE.UU. van a us.html
    // Solo redirigimos si: es de US, no es bot, no es clic de Ads, y no está ya en us.html
    if (country === "US" && path !== "/us.html" && !isBot && !isAdClick) {
      url.pathname = "/us.html";
      
      // Enviar notificación a Telegram
      ctx.waitUntil(sendTelegram(env, 
        `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}, ${region}\nIP: ${ip}`
      ));
      
      return Response.redirect(url.toString(), 302);
    }

    // 4. Notificación de visitas normales (Colombia y resto del mundo)
    if (!isBot) {
      const pageType = path === "/us.html" ? "Inglés 🇺🇸" : "Español 🇨🇴";
      const message = 
        `🌍 Nueva visita en NexoDigital\n` +
        `Página: ${pageType}\n` +
        `País: ${country}\n` +
        `Ciudad: ${city}\n` +
        `Región: ${region}\n` +
        `IP: ${ip}`;
      
      ctx.waitUntil(sendTelegram(env, message));
    }

    // 5. Servir los archivos estáticos de Cloudflare Pages (index.html, us.html)
    return env.ASSETS.fetch(request);
  }
};

// Función para enviar mensaje a Telegram
async function sendTelegram(env, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.error("Falta configurar TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en Cloudflare Pages");
    return;
  }

  const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        disable_notification: false
      })
    });
  } catch (e) {
    console.error("Error al enviar Telegram:", e);
  }
}
