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
    
    // --- PON TUS DATOS AQUÍ ---
    const TOKEN = "AQUI_TU_TOKEN_DE_TELEGRAM";
    const CHAT_ID = "AQUI_TU_CHAT_ID";
    // ---------------------------

    // 1. LÓGICA DE REDIRECCIÓN PARA EE.UU.
    // Solo redirigimos si está en la raíz ("/") o en "/index.html". 
    // Así evitamos cualquier bucle infinito.
    if (country === "US" && (path === "/" || path === "/index.html") && !isBot && !isAdClick) {
      
      // Notificamos la redirección
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      
      // Redirigimos a us.html
      return Response.redirect(new URL("/us.html", request.url).toString(), 302);
    }

    // 2. NOTIFICACIÓN DE VISITA NORMAL
    // Si no es un bot, notificamos qué página está viendo
    if (!isBot) {
      const esIngles = path.includes("us.html");
      const pageType = esIngles ? "Inglés 🇺🇸" : "Español 🇨🇴";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    // 3. ENTREGA DE LOS ARCHIVOS HTML
    // Si llegamos hasta aquí, es porque no hubo redirección.
    // Usamos env.ASSETS.fetch(request) tal cual, sin modificar la URL, 
    // para que Cloudflare encuentre exactamente el archivo que el usuario pidió.
    return env.ASSETS.fetch(request);
  }
};

async function enviarTelegram(token, chatId, text) {
  if (!token || !chatId || token === "AQUI_TU_TOKEN_DE_TELEGRAM") return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch (e) {
    console.error("Error Telegram:", e);
  }
}
