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
    
    // --- PON TUS DATOS AQUÍ (Cuidado con los espacios) ---
    const TOKEN = "TU_TOKEN_DE_TELEGRAM_AQUI";
    const CHAT_ID = "TU_CHAT_ID_AQUI";
    // ------------------------------------------------------

    // 1. Redirección para EE.UU.
    if (country === "US" && (path === "/" || path === "/index.html") && !isBot && !isAdClick) {
      
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      
      return Response.redirect(new URL("/us.html", request.url).toString(), 302);
    }

    // 2. Notificación de visita normal
    if (!isBot) {
      const esIngles = path.includes("us.html");
      const pageType = esIngles ? "Inglés 🇺🇸" : "Español 🇨🇴";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    // 3. Entregar el HTML
    return env.ASSETS.fetch(request);
  }
};

async function enviarTelegram(token, chatId, text) {
  if (!token || !chatId || token === "TU_TOKEN_DE_TELEGRAM_AQUI") {
    console.error("DEBUG: Faltan las credenciales en el código.");
    return;
  }
  
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    
    // Si Telegram rechaza el mensaje, lo mostramos en consola
    if (!res.ok) {
      const errorData = await res.text();
      console.error("DEBUG Telegram Error:", errorData);
    } else {
      console.log("DEBUG: Notificación enviada con éxito.");
    }
  } catch (e) {
    console.error("DEBUG Fetch Error:", e);
  }
}
