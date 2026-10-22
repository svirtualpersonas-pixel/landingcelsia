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
    
    const TOKEN = "AQUI_TU_TOKEN_DE_TELEGRAM";
    const CHAT_ID = "AQUI_TU_CHAT_ID";

    // 1. SI ES DE EE.UU. Y NO ESTÁ EN US.HTML -> REDIRIGIR UNA SOLA VEZ
    if (country === "US" && path !== "/us.html" && !isBot && !isAdClick) {
      
      // Notificar a Telegram
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      
      // Redirigir a us.html
      const newUrl = new URL("/us.html", request.url);
      return Response.redirect(newUrl.toString(), 302);
    }

    // 2. SI YA ESTÁ EN US.HTML O ES DE COLOMBIA -> NOTIFICAR Y MOSTRAR PÁGINA
    if (!isBot) {
      const pageType = path.includes("us.html") ? "Inglés 🇺🇸" : "Español 🇨🇴";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    // 3. SERVIR EL ARCHIVO CORRECTO (Evita el bucle)
    // Si la ruta es us.html, servimos us.html. Si no, servimos index.html (la raíz).
    const targetPath = path === "/us.html" ? "/us.html" : "/index.html";
    const assetUrl = new URL(targetPath, request.url);
    
    return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
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
