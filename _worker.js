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
    
    // --- PON TUS DATOS AQUÍ (Asegúrate de no dejar espacios) ---
    const TOKEN = "TU_TOKEN_AQUI";
    const CHAT_ID = "TU_CHAT_ID_AQUI";
    // -----------------------------------------------------------

    if (country === "US" && (path === "/" || path === "/index.html") && !isBot && !isAdClick) {
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      return Response.redirect(new URL("/us.html", request.url).toString(), 302);
    }

    if (!isBot) {
      const esIngles = path.includes("us.html");
      const pageType = esIngles ? "Inglés 🇺🇸" : "Español 🇨🇴";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    return env.ASSETS.fetch(request);
  }
};

async function enviarTelegram(token, chatId, text) {
  if (!token || !chatId || token === "TU_TOKEN_AQUI") return;

  // Usamos una IP directa de Telegram para evitar bloqueos de DNS de Cloudflare
  const url = `https://149.154.167.220/bot${token}/sendMessage`; 
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Host": "api.telegram.org" // Esto engaña a Telegram para que acepte la IP
      },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    if (!res.ok) console.error("Error API:", await res.text());
  } catch (e) {
    console.error("Error Fetch:", e);
  }
}
