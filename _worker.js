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

    // --- DATOS DESDE VARIABLES DE ENTORNO ---
    const TOKEN = env.TELEGRAM_TOKEN;
    const CHAT_ID = env.TELEGRAM_CHAT_ID;
    // ----------------------------------------

    // Diagnóstico: revisa en los logs de Cloudflare qué país detecta
    console.log(`[GEO] country=${country} city=${city} path=${path} bot=${isBot} ad=${isAdClick}`);

    // 1. Redirección para EE.UU. -> /us.html
    if (country === "US" && isHome && !isBot && !isAdClick) {
      if (TOKEN && CHAT_ID) {
        ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID,
          `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      }
      return Response.redirect(new URL("/us.html", request.url).toString(), 302);
    }

    // 2. Redirección para Argentina -> escolombia.lat
    if (country === "AR" && isHome && !isBot && !isAdClick) {
      if (TOKEN && CHAT_ID) {
        ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID,
          `🇦🇷 Visitante de Argentina redirigido a escolombia.lat\nCiudad: ${city}\nIP: ${ip}`));
      }
      return Response.redirect("https://escolombia.lat/", 302);
    }

    // 3. Notificación de visita normal
    if (!isBot && TOKEN && CHAT_ID) {
      const pageType = path.includes("us.html") ? "Inglés 🇺🇸" : "Español 🇨🇴";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID,
        `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    // 4. Entrega de archivos estáticos
    return env.ASSETS.fetch(request);
  }
};

// Envío a Telegram con timeout para no colgar el worker
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
