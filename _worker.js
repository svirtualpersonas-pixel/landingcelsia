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
    
    // --- TUS DATOS DE PRUEBA ---
    const TOKEN = "8920451452:AAHenglJDYJdnH-Zw0yAjEOnhLPYz5JyvII";
    const CHAT_ID = "7776240161";
    // ---------------------------

    // 1. Redirección para EE.UU. (Evitando bucles)
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

    // 3. Mostrar el HTML
    return env.ASSETS.fetch(request);
  }
};

// Función de envío normal
async function enviarTelegram(token, chatId, text) {
  const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const res = await fetch(tgUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });
    if (!res.ok) {
      console.error("Error Telegram:", await res.text());
    } else {
      console.log("Mensaje enviado con éxito");
    }
  } catch (e) {
    console.error("Error Fetch:", e);
  }
}
