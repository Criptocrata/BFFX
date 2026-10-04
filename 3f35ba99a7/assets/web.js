/* BotFactoryFX · la web (web-v5): lo poco que necesita JavaScript.
   ═══════════════════════════════════════════════════════════════════════════
   Todo lo que hay aquí es adorno o atajo: sin JavaScript la página se lee
   entera, el tema sigue al sistema y los botones de compra llevan a una
   dirección que funciona.

   Los textos que escribe este guion salen del atributo lang del documento:
   inglés por defecto, castellano en /es/. */
(function () {
  "use strict";
  const raiz = document.documentElement;
  raiz.classList.add("js");
  const ES = (raiz.lang || "en").toLowerCase().startsWith("es");
  const T = ES
    ? {
        tema: { system: "Tema del sistema", light: "Tema claro", dark: "Tema oscuro" },
        creando: "Creando tu factura…",
        sinCobro: "El cobro no contesta ahora mismo. Escríbenos a botfactoryfx@proton.me y te mandamos la factura a mano.",
        recomendado: (precio, lista) => `Vienes recomendado: pagas ${precio} USD en vez de ${lista}. El descuento va en la factura, sin pedirlo.`,
        comprar: (precio) => `Comprar licencia · ${precio} USD`,
        pausa: "Pausa", sigue: "Reanudar",
      }
    : {
        tema: { system: "System theme", light: "Light theme", dark: "Dark theme" },
        creando: "Creating your invoice…",
        sinCobro: "Checkout isn't answering right now. Write to botfactoryfx@proton.me and we'll send you the invoice by hand.",
        recomendado: (precio, lista) => `You were referred: you pay $${precio} instead of $${lista}. The discount is on the invoice, nothing to ask for.`,
        comprar: (precio) => `Buy a licence · $${precio}`,
        pausa: "Pause", sigue: "Play",
      };

  /* ── El tema: claro, oscuro o sistema ────────────────────────────────────
     El <head> ya lo aplicó antes de pintar (sin parpadeo); aquí sólo se
     atienden los botones. Sin elección, claro (03-10-2026): el claro BORRA la
     elección, y «sistema» se guarda como tal, porque es la única opción que
     mira prefers-color-scheme ([data-theme=system] en web.css). */
  const CLAVE = "bfx-web-tema";
  function leerTema() {
    try { return localStorage.getItem(CLAVE) || "light"; } catch { return "light"; }
  }
  function ponerTema(t) {
    if (t === "dark" || t === "system") raiz.setAttribute("data-theme", t);
    else raiz.removeAttribute("data-theme");
    try {
      if (t === "dark" || t === "system") localStorage.setItem(CLAVE, t);
      else localStorage.removeItem(CLAVE);
    } catch { /* sin almacenamiento: vale para esta visita */ }
    for (const b of document.querySelectorAll(".tema button")) {
      b.setAttribute("aria-pressed", String(b.dataset.tema === t));
    }
  }
  for (const grupo of document.querySelectorAll(".tema")) {
    for (const b of grupo.querySelectorAll("button")) {
      const etiqueta = T.tema[b.dataset.tema];
      b.title = etiqueta; b.setAttribute("aria-label", etiqueta);
      b.addEventListener("click", () => ponerTema(b.dataset.tema));
    }
  }
  ponerTema(leerTema());

  /* ── La impresora del tique ──────────────────────────────────────────────
     Imprime las líneas cuando el tique entra en pantalla, y luego grapa el de
     BotFactoryFX. Una vez: no vuelve a imprimir al subir y bajar. */
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const factura = document.querySelector(".factura-rejilla");
  if (factura) {
    const tique = factura.querySelector(".tique");
    const imprimir = () => { tique && tique.classList.add("impreso"); factura.classList.add("impresa"); };
    if (quieto || !("IntersectionObserver" in window)) imprimir();
    else {
      const o = new IntersectionObserver((entradas) => {
        if (entradas.some((e) => e.isIntersecting)) { imprimir(); o.disconnect(); }
      }, { threshold: 0.35 });
      o.observe(factura);
    }
  }

  /* ── Los vídeos ──────────────────────────────────────────────────────────
     El de la portada (data-bucle) arranca solo. Los de «How it works»
     (data-al-verse) son cuatro por página: no se descargan hasta que se
     acercan (preload=none), arrancan al entrar en pantalla y se paran al
     salir. Con el movimiento reducido ninguno arranca solo, y todos se pueden
     parar; el que alguien para a mano no vuelve a arrancar solo. */
  for (const v of document.querySelectorAll("video[data-bucle], video[data-al-verse]")) {
    const mando = document.querySelector(`[data-mando="${v.id}"]`);
    const pinta = () => { if (mando) mando.textContent = v.paused ? T.sigue : T.pausa; };
    let aMano = false;
    if (quieto) { v.removeAttribute("autoplay"); v.pause(); }
    else if (v.hasAttribute("data-bucle")) v.play().catch(() => {});
    v.addEventListener("play", pinta); v.addEventListener("pause", pinta); pinta();
    if (mando) mando.addEventListener("click", () => {
      aMano = !v.paused;
      if (v.paused) v.play().catch(() => {}); else v.pause();
    });
    if (v.hasAttribute("data-al-verse") && !quieto && "IntersectionObserver" in window) {
      new IntersectionObserver((entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting && !aMano) v.play().catch(() => {});
          else if (!e.isIntersecting && !v.paused) v.pause();
        }
      }, { threshold: 0.4 }).observe(v);
    }
  }

  /* ── El índice de «How it works» ─────────────────────────────────────────
     Marca el capítulo que se está leyendo, y en un teléfono lo trae a la
     vista dentro de la tira. */
  const indice = document.querySelector(".indice");
  if (indice && "IntersectionObserver" in window) {
    const enlaces = new Map([...indice.querySelectorAll("a")].map((a) => [a.getAttribute("href").slice(1), a]));
    const o = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        const a = e.isIntersecting && enlaces.get(e.target.id);
        if (!a) continue;
        for (const x of enlaces.values()) x.removeAttribute("aria-current");
        a.setAttribute("aria-current", "location");
        const tira = a.closest("ol");
        if (tira) tira.scrollTo({ left: a.parentElement.offsetLeft - 16, behavior: quieto ? "auto" : "smooth" });
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    for (const s of document.querySelectorAll(".capitulo")) o.observe(s);
  }

  /* ── La recomendación: ?ref=BFR-… ────────────────────────────────────────
     Se pregunta al cobro si el código vale y a cuánto sale ANTES de enseñar
     un precio: prometer uno que el botón no va a cobrar es peor que no decir
     nada. Sólo BotFactoryFX entra en el programa. El código es BFR-, no un
     número de pedido (03-10-2026): ése abre la compra y no se publica. */
  const ref = (new URLSearchParams(location.search).get("ref") || "").trim().toUpperCase();
  const botones = [...document.querySelectorAll("a[data-cobro]")];
  const grandes = botones.filter((b) => !b.dataset.producto);
  const caja = document.getElementById("recomendado");
  if (ref && /^BFR-[2-9A-HJ-NP-Z]{8}-[2-9A-HJ-NP-Z]{8}$/.test(ref) && grandes.length && grandes[0].dataset.cobro) {
    fetch(grandes[0].dataset.cobro + "/recomendacion?ref=" + encodeURIComponent(ref))
      .then((r) => r.json())
      .then((v) => {
        if (!v || !v.vale) return;
        const precio = String(Number(v.precio));
        if (caja) { caja.textContent = T.recomendado(precio, grandes[0].dataset.lista || "999"); caja.hidden = false; }
        for (const b of grandes) if (b.dataset.conPrecio !== undefined) b.textContent = T.comprar(precio);
      })
      .catch(() => {});
  }

  /* ── Comprar ─────────────────────────────────────────────────────────────
     POST a /comprar (crear una factura no es leer nada: con un enlace, cada
     rastreador abriría una) y al comprador a NUESTRA página de compra, con su
     número y la factura de Plisio, y desde ella paga. Hasta el 04-10-2026 iba
     derecho a Plisio, y quien cerraba esa pestaña antes de que la red
     confirmara se quedaba sin camino de vuelta: el correo de Plisio no lleva
     nuestra página. Si el cobro no contesta, NO se manda a un botón de pago de
     importe fijo —el viejo era de 499 y cobraría lo que no es—: se dice qué
     pasa y a quién escribir. */
  let pidiendo = false;
  for (const boton of botones) {
    boton.addEventListener("click", async (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      if (pidiendo) return;
      pidiendo = true;
      const dice = boton.textContent;
      boton.textContent = T.creando;
      try {
        const cuerpo = {};
        if (ref) cuerpo.ref = ref;
        if (boton.dataset.producto) cuerpo.producto = boton.dataset.producto;
        const r = await fetch(boton.dataset.cobro + "/comprar", {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo),
        });
        const v = await r.json();
        if (!v || !v.pagar || !v.pedido) throw new Error(v && v.error ? v.error : "sin factura");
        /* Plisio devuelve al comprador a /descarga/, que es la inglesa; esto
           le dice a esa página que la compra empezó en castellano. Sólo en
           esta pestaña y sólo hasta cerrarla. */
        try { sessionStorage.setItem("bfx-web-idioma", ES ? "es" : "en"); } catch { /* sin almacenamiento, inglés */ }
        /* La página de compra de ESTA lengua: la marca de la cabecera lleva a
           su portada, y la de compra cuelga de ella. */
        const marca = document.querySelector("a.marca");
        const casa = new URL((marca && marca.getAttribute("href")) || "./", location.href);
        const compra = new URL("descarga/", casa);
        compra.searchParams.set("p", v.pedido);
        compra.searchParams.set("pagar", v.pagar);
        location.href = compra.toString();
      } catch (err) {
        console.warn("el cobro no ha contestado:", err);
        boton.textContent = dice;
        pidiendo = false;
        alert(T.sinCobro);
      }
    });
  }
})();
