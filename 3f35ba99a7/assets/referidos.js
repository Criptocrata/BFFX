/* La página de la recomendación (web-v5): la galería de banners y el código
   para pegar, con el código de recomendación de quien recomienda dentro
   (BFR-…). NO su número de pedido: desde el 03-10-2026 son dos cosas, porque
   el número de pedido abre la compra y un banner lo publica.

   Nada sale de esta página: el número se escribe aquí y aquí se queda. */
(function () {
  "use strict";
  const galeria = document.querySelector(".galeria");
  if (!galeria) return;
  const ES = (document.documentElement.lang || "en").startsWith("es");
  const SITIO = galeria.dataset.sitio;
  const BASE = galeria.dataset.base;
  const T = ES
    ? {
        hueco: "TU-CÓDIGO", copiar: "Copiar el código", copiado: "Copiado",
        alt: { en: "BotFactoryFX. Generate thousands. Keep the ones that hold up.", es: "BotFactoryFX. Genera miles. Quédate con las que aguantan." },
        nombres: { "300x250": "Rectángulo mediano", "336x280": "Rectángulo grande", "250x250": "Cuadrado", "728x90": "Cabecera", "970x250": "Valla", "160x600": "Rascacielos ancho", "300x600": "Media página", "320x50": "Móvil", "320x100": "Móvil grande", "1200x628": "Redes: enlace", "1080x1080": "Redes: cuadrado" },
        redes: "Para redes: súbela con tu enlace en el texto.",
      }
    : {
        hueco: "YOUR-CODE", copiar: "Copy the code", copiado: "Copied",
        alt: { en: "BotFactoryFX. Generate thousands. Keep the ones that hold up.", es: "BotFactoryFX. Genera miles. Quédate con las que aguantan." },
        nombres: { "300x250": "Medium rectangle", "336x280": "Large rectangle", "250x250": "Square", "728x90": "Leaderboard", "970x250": "Billboard", "160x600": "Wide skyscraper", "300x600": "Half page", "320x50": "Mobile", "320x100": "Large mobile", "1200x628": "Social: link", "1080x1080": "Social: square" },
        redes: "For social media: post it with your link in the text.",
      };
  const FORMATOS = ["300x250", "336x280", "250x250", "728x90", "970x250", "160x600", "300x600", "320x50", "320x100", "1200x628", "1080x1080"];
  const REDES = new Set(["1200x628", "1080x1080"]);
  const entrada = document.getElementById("codigo");
  let lengua = ES ? "es" : "en";

  const codigo = () => {
    const c = (entrada.value || "").trim().toUpperCase();
    return /^BFR-[2-9A-HJ-NP-Z]{8}-[2-9A-HJ-NP-Z]{8}$/.test(c) ? c : T.hueco;
  };
  const escapa = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function pinta() {
    const c = codigo();
    const destino = `${SITIO}${lengua === "es" ? "es/" : ""}?ref=${c}`;
    galeria.innerHTML = "";
    for (const id of FORMATOS) {
      const [w, h] = id.split("x").map(Number);
      const red = REDES.has(id);
      const uno = `${BASE}${lengua}/bfx-${id}.png`;
      const dos = `${BASE}${lengua}/bfx-${id}@2x.png`;
      const abs1 = `${SITIO}banners/${lengua}/bfx-${id}.png`;
      const abs2 = `${SITIO}banners/${lengua}/bfx-${id}@2x.png`;
      const html = red
        ? null
        : `<a href="${destino}"><img src="${abs1}" srcset="${abs2} 2x" width="${w}" height="${h}" alt="${T.alt[lengua]}"></a>`;
      const ficha = document.createElement("figure");
      ficha.className = "banner" + (w >= 700 ? " banner-ancho" : "");
      ficha.innerHTML = `
        <div class="banner-vista"><img src="${uno}" ${red ? "" : `srcset="${dos} 2x"`} width="${w}" height="${h}" alt="${T.alt[lengua]}" loading="lazy" style="max-width:100%;height:auto"></div>
        <figcaption>
          <b>${T.nombres[id]}</b> <span class="cifra">${w}×${h}</span>
          <span class="banner-ficheros"><a href="${uno}" download>PNG</a>${red ? "" : ` · <a href="${dos}" download>PNG 2×</a>`}</span>
          ${red ? `<span class="nota">${T.redes}</span>` : `<pre>${escapa(html)}</pre><button type="button" class="boton boton-linea boton-chico copiar">${T.copiar}</button>`}
        </figcaption>`;
      const boton = ficha.querySelector(".copiar");
      if (boton) {
        boton.addEventListener("click", async () => {
          try { await navigator.clipboard.writeText(html); boton.textContent = T.copiado; setTimeout(() => (boton.textContent = T.copiar), 1500); } catch { /* el texto sigue a la vista para copiarlo a mano */ }
        });
      }
      galeria.appendChild(ficha);
    }
  }
  entrada.addEventListener("input", pinta);
  for (const b of document.querySelectorAll(".lenguas button")) {
    if (b.dataset.lengua === lengua) b.setAttribute("aria-pressed", "true"); else b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      lengua = b.dataset.lengua;
      for (const o of document.querySelectorAll(".lenguas button")) o.setAttribute("aria-pressed", String(o === b));
      pinta();
    });
  }
  pinta();
})();
