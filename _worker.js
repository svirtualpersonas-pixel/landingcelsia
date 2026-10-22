export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cf = request.cf || {};
    
    const country = cf.country || "Desconocido";
    const city = cf.city || "Desconocido";
    const region = cf.region || "Desconocido";
    const ip = request.headers.get("CF-Connecting-IP") || "Desconocido";
    const userAgent = request.headers.get("User-Agent") || "Desconocido";

    const isBot = /Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot/i.test(userAgent);
    const isAdClick = url.searchParams.has("gclid");
    
    if (country === "US" && path !== "/us.html" && !isBot && !isAdClick) {
      url.pathname = "/us.html";
      ctx.waitUntil(sendTelegram(env, `🇺🇸 Visitante de EE.UU. redirigido\nCiudad: ${city}, ${region}\nIP: ${ip}`));
      return Response.redirect(url.toString(), 302);
    }

    if (!isBot) {
      const pageType = path === "/us.html" ? "Inglés 🇺🇸" : "Español 🇨🇴";
      const message = `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nRegión: ${region}\nIP: ${ip}`;
      ctx.waitUntil(sendTelegram(env, message));
    }

    return env.ASSETS.fetch(request);
  }
};

async function sendTelegram(env, text) {
  // Buscamos las variables en 'env' o en 'process.env' (común en Pages)
  const token = env.TELEGRAM_BOT_TOKEN || (typeof process !== 'undefined' ? process.env.TELEGRAM_BOT_TOKEN : null);
  const chatId = env.TELEGRAM_CHAT_ID || (typeof process !== 'undefined' ? process.env.TELEGRAM_CHAT_ID : null);
  
  if (!token || !chatId) {
    console.error("DEBUG: Faltan credenciales. Token:", token ? "OK" : "VACIO", "ChatID:", chatId ? "OK" : "VACIO");
    return;
  }

  const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const response = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        disable_notification: false
      })
    });
    
    if (!response.ok) {
       const errorData = await response.text();
       console.error("DEBUG Error Telegram API:", errorData);
    }
  } catch (e) {
    console.error("DEBUG Error Fetch Telegram:", e);
  }
}
