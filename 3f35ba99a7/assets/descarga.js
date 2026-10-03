/* La página de después de pagar (web-v5): estado del pedido, la descarga por
   sistema, la licencia y el enlace de recomendación. Sirve a las dos lenguas:
   los textos salen de data-lengua del <main>.

   Lo que habla con el cobro es lo mismo que en web-v3/descarga.html, que es
   donde está explicado: /estado se pregunta con frenado (una pestaña olvidada
   toda la noche no son diez mil peticiones), /licencia firma con la huella, y
   /descarga entrega el fichero de ESTE producto y de ESTE sistema. */
(function () {
  "use strict";
  const main = document.querySelector("main[data-api]");
  if (!main) return;
  const API = main.dataset.api;
  const SITIO = main.dataset.sitio;
  const ES = main.dataset.lengua === "es";
  const T = ES
    ? {
        sistemas: { windows: "Windows", "macos-arm64": "un Mac con chip de Apple", "macos-x64": "un Mac con Intel", linux: "Linux" },
        sugerido: (s) => `Parece que estás en ${s}: es el botón resaltado.`,
        sugeridoMac: "Parece que estás en un Mac. Los de finales de 2020 en adelante llevan chip de Apple (M1–M4); los anteriores, Intel.",
        recomendadas: (n) => n === 1
          ? "Ya ha comprado una persona con tu código: son 100 USDT para ti. Escríbenos con tu número de pedido y tu dirección TRON para cobrarlos."
          : `Ya han comprado ${n} personas con tu código: son ${n * 100} USDT para ti. Escríbenos con tu número de pedido y tu dirección TRON para cobrarlos.`,
        pegaHuella: "Pega primero la huella que te enseña el programa.",
        firmando: "Firmando…", dameLicencia: "Dame mi licencia",
        sinCambios: "Ya tienes la licencia en tres máquinas. Escríbenos y lo vemos.",
        noEmitida: "No ha podido emitirse. Escríbenos con tu número de pedido.",
        sinConexion: "No se ha podido conectar. Inténtalo otra vez en un minuto.",
        ref: "es/",
      }
    : {
        sistemas: { windows: "Windows", "macos-arm64": "a Mac with Apple silicon", "macos-x64": "an Intel Mac", linux: "Linux" },
        sugerido: (s) => `Looks like you’re on ${s}: it’s the highlighted button.`,
        sugeridoMac: "Looks like you’re on a Mac. Macs from late 2020 on have Apple silicon (M1–M4); older ones, Intel.",
        recomendadas: (n) => n === 1
          ? "One person has already bought with your code: that’s 100 USDT for you. Write to us with your order number and your TRON address to get paid."
          : `${n} people have already bought with your code: that’s ${n * 100} USDT for you. Write to us with your order number and your TRON address to get paid.`,
        pegaHuella: "Paste the fingerprint the program shows you first.",
        firmando: "Signing…", dameLicencia: "Get my licence",
        sinCambios: "Your licence is already on three machines. Write to us and we’ll sort it out.",
        noEmitida: "It couldn’t be issued. Write to us with your order number.",
        sinConexion: "Couldn’t connect. Try again in a minute.",
        ref: "",
      };

  /* El sistema del visitante, para resaltar su botón. Con userAgentData se
     sabe hasta la arquitectura; sin ella (Safari, Firefox) un Mac no dice si
     es Apple o Intel, y entonces se resaltan los dos y se explica. */
  async function sistemaProbable() {
    const ua = navigator.userAgent || "";
    const d = navigator.userAgentData;
    if (d && d.getHighEntropyValues) {
      try {
        const v = await d.getHighEntropyValues(["platform", "architecture"]);
        if (/mac/i.test(v.platform)) return v.architecture === "arm" ? "macos-arm64" : v.architecture === "x86" ? "macos-x64" : "mac";
        if (/win/i.test(v.platform)) return "windows";
        if (/linux|chrome os/i.test(v.platform)) return "linux";
      } catch { /* sigue por el agente */ }
    }
    if (/Windows/.test(ua)) return "windows";
    if (/Macintosh|Mac OS X/.test(ua)) return "mac";
    if (/Linux/.test(ua) && !/Android/.test(ua)) return "linux";
    return null;
  }

  const pedido = (new URLSearchParams(location.search).get("p") || "").trim().toUpperCase();
  const otro = document.getElementById("otro-idioma");
  if (otro) {
    otro.href = otro.getAttribute("href") + location.search;
    // Cambiar de lengua aquí es elegirla: sin esto la inglesa devolvería a la
    // española por la marca que dejó la compra.
    otro.addEventListener("click", () => { try { sessionStorage.setItem("bfx-web-idioma", ES ? "en" : "es"); } catch { /* nada */ } });
  }
  const ver = (id) => {
    for (const s of ["sin-pedido", "cargando", "esperando", "listo", "revisar", "cerrado"]) {
      const el = document.getElementById(s);
      if (el) el.hidden = s !== id;
    }
  };
  if (!/^BF[XQ]-[2-9A-HJ-NP-Z]{8}-[2-9A-HJ-NP-Z]{8}$/.test(pedido)) { ver("sin-pedido"); return; }
  for (const el of document.querySelectorAll(".num")) el.textContent = pedido;

  for (const a of document.querySelectorAll("[data-sistema]")) {
    a.href = `${API}/descarga?p=${encodeURIComponent(pedido)}&sistema=${a.dataset.sistema}`;
  }
  sistemaProbable().then((s) => {
    if (!s) return;
    const marcar = (id) => {
      const a = document.querySelector(`[data-sistema="${id}"]`);
      if (a) { a.classList.remove("boton-linea"); a.classList.add("boton-ambar"); }
    };
    const caja = document.getElementById("sugerido");
    if (s === "mac") { marcar("macos-arm64"); marcar("macos-x64"); if (caja) caja.textContent = T.sugeridoMac; }
    else { marcar(s); if (caja) caja.textContent = T.sugerido(T.sistemas[s]); }
  });

  let espera = 3000;
  async function mirar() {
    let v;
    try {
      const r = await fetch(`${API}/estado?p=${encodeURIComponent(pedido)}`);
      v = await r.json();
    } catch {
      setTimeout(mirar, espera);
      return;
    }
    if (v.estado === "listo") {
      document.getElementById("quedan-descargas").textContent = v.descargasRestantes ?? "—";
      document.getElementById("quedan-huellas").textContent = v.huellasRestantes ?? "—";
      /* El nombre de lo que compró: los dos nombres son una copia de
         servidor/src/catalogo.ts, que es lo que dice la factura. */
      const NOMBRES = { fx: "BotFactoryFX", quarantine: "BFQuarantine" };
      const nombre = NOMBRES[v.producto] ?? NOMBRES.fx;
      for (const a of document.querySelectorAll("[data-sistema]")) {
        a.setAttribute("aria-label", `${nombre} · ${a.textContent.trim()}`);
      }
      // BFQuarantine no entra en la recomendación: con 100 + 100 sobre 99 se vendería a pérdida.
      const recomendar = document.getElementById("recomendar");
      if (v.producto === "quarantine" && recomendar) recomendar.hidden = true;
      document.getElementById("enlace-ref").textContent = `${SITIO}${T.ref}?ref=${pedido}`;
      if (v.recomendaciones > 0) {
        const aviso = document.getElementById("ya-recomendadas");
        aviso.textContent = T.recomendadas(v.recomendaciones);
        aviso.hidden = false;
      }
      ver("listo");
      return;
    }
    if (v.estado === "revisar") { ver("revisar"); return; }
    if (v.estado === "cerrado") { ver("cerrado"); return; }
    if (v.estado === "desconocido") { ver("sin-pedido"); return; }
    ver("esperando");
    espera = Math.min(espera * 1.4, 60_000);
    setTimeout(mirar, espera);
  }
  mirar();

  const pedir = document.getElementById("pedir");
  pedir.addEventListener("click", async () => {
    const error = document.getElementById("error-licencia");
    const huella = document.getElementById("huella").value.trim();
    error.hidden = true;
    if (!huella) { error.textContent = T.pegaHuella; error.hidden = false; return; }
    pedir.disabled = true;
    pedir.textContent = T.firmando;
    try {
      const r = await fetch(`${API}/licencia`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pedido, huella }),
      });
      const v = await r.json();
      if (v.licencia) {
        document.getElementById("clave").textContent = v.licencia;
        document.getElementById("salida").hidden = false;
        if (typeof v.huellasRestantes === "number") document.getElementById("quedan-huellas").textContent = v.huellasRestantes;
      } else if (v.huellasRestantes === 0) {
        error.textContent = T.sinCambios; error.hidden = false;
      } else {
        error.textContent = v.error || T.noEmitida; error.hidden = false;
      }
    } catch {
      error.textContent = T.sinConexion; error.hidden = false;
    }
    pedir.disabled = false;
    pedir.textContent = T.dameLicencia;
  });
})();
