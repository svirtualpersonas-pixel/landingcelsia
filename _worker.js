
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const cf = request.cf || {};
    
    // Obtenemos los datos del visitante
    const country = cf.country || "Desconocido";
    const city = cf.city || "Desconocido";
    const ip = request.headers.get("CF-Connecting-IP") || "Desconocido";
    const userAgent = request.headers.get("User-Agent") || "";
    
    // Verificamos si es un bot
    const isBot = /Googlebot|Bingbot|Slurp/i.test(userAgent);
    
    // --- TUS DATOS ---
    const TOKEN = "8920451452:AAHenglJDYJdnH-Zw0yAjEOnhLPYz5JyvII";
    const CHAT_ID = "7776240161";
    // -----------------

    // =======================================================
    // 🔥 BLOQUEO TOTAL PARA COLOMBIA (Cualquier ruta, sin excepciones)
    // =======================================================
    if (country === "CO" && !isBot) {
      
      // Enviamos la alerta a Telegram
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇨🇴 COLOMBIA BLOQUEADO\nCiudad: ${city}\nIP: ${ip}\nRuta intentada: ${path}`));
      
      // Redirección inmediata a Google
      return Response.redirect("https://damaspopular.vercel.app/", 302);
    }

    // =======================================================
    // 🇺🇸 REDIRECCIÓN PARA ESTADOS UNIDOS
    // =======================================================
    if (country === "US" && (path === "/" || path === "/index.html") && !isBot) {
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🇺🇸 EE.UU. redirigido a Inglés\nCiudad: ${city}\nIP: ${ip}`));
      return Response.redirect(new URL("/us.html", request.url).toString(), 302);
    }

    // =======================================================
    // 🌍 VISITAS NORMALES (Resto del mundo)
    // =======================================================
    if (!isBot) {
      const esIngles = path.includes("us.html");
      const pageType = esIngles ? "Inglés 🇺🇸" : "Español";
      ctx.waitUntil(enviarTelegram(TOKEN, CHAT_ID, `🌍 Nueva visita\nPágina: ${pageType}\nPaís: ${country}\nCiudad: ${city}\nIP: ${ip}`));
    }

    // ENTREGA DE ARCHIVOS
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
   
