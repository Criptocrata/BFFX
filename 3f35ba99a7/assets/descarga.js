/* La página de después de pagar (web-v5): estado del pedido, la descarga por
   sistema, la licencia y la recomendación. Sirve a las dos lenguas: los
   textos salen de data-lengua del <main>.

   La recomendación (03-10-2026): el enlace lleva el código BFR- que da la
   tienda, NO el número de pedido —ése abre la compra y un banner lo
   publicaría—, y quien recomienda deja aquí, una vez, su dirección de TRON y
   un correo. Con eso se le paga cada venta sin que tenga que escribirnos.

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
  const LOCALE = ES ? "es-ES" : "en-GB";
  /** Una cifra de USDT como se dice: «100», «150,5» o «150.5». */
  const usdt = (x) => Number(x).toLocaleString(LOCALE, { maximumFractionDigits: 2, useGrouping: false });
  const fecha = (ms) => new Date(ms).toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
  const T = ES
    ? {
        sistemas: { windows: "Windows", "macos-arm64": "un Mac con chip de Apple", "macos-x64": "un Mac con Intel", linux: "Linux" },
        sugerido: (s) => `Parece que estás en ${s}: es el botón resaltado.`,
        sugeridoMac: "Parece que estás en un Mac. Los de finales de 2020 en adelante llevan chip de Apple (M1–M4); los anteriores, Intel.",
        ventas: (r) => {
          const quien = r.ventas === 1 ? "Ya ha comprado una persona con tu código." : `Ya han comprado ${r.ventas} personas con tu código.`;
          const falta = Number(r.pendiente) > 0
            ? (r.cobro ? ` Van de camino ${usdt(r.pendiente)} USDT.` : ` Te esperan ${usdt(r.pendiente)} USDT: dinos a dónde mandarlos.`)
            : "";
          return quien + falta;
        },
        pendienteSinDireccion: (x) => `Te esperan ${usdt(x)} USDT. Déjanos tu dirección y te los mandamos.`,
        pago: (p) => `${usdt(p.importe)} USDT pagados el ${fecha(p.en)} · `,
        verTx: "ver la transacción",
        guardar: "Guardar", guardando: "Guardando…",
        errores: {
          direccion: "Eso no es una dirección de TRON. Comprueba que empiece por T y que no falte ni sobre ninguna letra. Una de Ethereum o de Bitcoin no vale: tiene que ser de TRON (TRC-20).",
          correo: "Ese correo no parece un correo.",
          tope: "Ya lo has cambiado tres veces desde aquí. Para cambiarlo otra vez, escríbenos.",
          otro: "No se ha podido guardar. Inténtalo otra vez en un minuto.",
        },
        pegaHuella: "Pega primero la huella que te enseña el programa.",
        firmando: "Firmando…", dameLicencia: "Dame mi licencia",
        sinCambios: "Ya tienes la licencia en tres máquinas. Escríbenos y lo vemos.",
        noEmitida: "No ha podido emitirse. Escríbenos con tu número de pedido.",
        sinConexion: "No se ha podido conectar. Inténtalo otra vez en un minuto.",
        creando: "Creando tu factura…",
        mejoraUsada: "Este pedido ya se usó para pasarse a BotFactoryFX.",
        mejoraNoVale: "Este pedido no da el descuento. Escríbenos con tu número de pedido y lo miramos.",
        ref: "es/",
      }
    : {
        sistemas: { windows: "Windows", "macos-arm64": "a Mac with Apple silicon", "macos-x64": "an Intel Mac", linux: "Linux" },
        sugerido: (s) => `Looks like you’re on ${s}: it’s the highlighted button.`,
        sugeridoMac: "Looks like you’re on a Mac. Macs from late 2020 on have Apple silicon (M1–M4); older ones, Intel.",
        ventas: (r) => {
          const quien = r.ventas === 1 ? "One person has bought with your code." : `${r.ventas} people have bought with your code.`;
          const falta = Number(r.pendiente) > 0
            ? (r.cobro ? ` ${usdt(r.pendiente)} USDT are on their way to you.` : ` ${usdt(r.pendiente)} USDT are waiting for you: tell us where to send them.`)
            : "";
          return quien + falta;
        },
        pendienteSinDireccion: (x) => `${usdt(x)} USDT are waiting for you. Leave your address and we’ll send them.`,
        pago: (p) => `${usdt(p.importe)} USDT paid on ${fecha(p.en)} · `,
        verTx: "see the transaction",
        guardar: "Save", guardando: "Saving…",
        errores: {
          direccion: "That isn’t a TRON address. Check that it starts with T and that no letter is missing or extra. An Ethereum or Bitcoin address won’t work: it has to be TRON (TRC-20).",
          correo: "That email doesn’t look right.",
          tope: "You’ve already changed it three times from here. To change it again, write to us.",
          otro: "It couldn’t be saved. Try again in a minute.",
        },
        pegaHuella: "Paste the fingerprint the program shows you first.",
        firmando: "Signing…", dameLicencia: "Get my licence",
        sinCambios: "Your licence is already on three machines. Write to us and we’ll sort it out.",
        noEmitida: "It couldn’t be issued. Write to us with your order number.",
        sinConexion: "Couldn’t connect. Try again in a minute.",
        creando: "Creating your invoice…",
        mejoraUsada: "This order has already been used to move up to BotFactoryFX.",
        mejoraNoVale: "This order doesn’t carry the discount. Write to us with your order number and we’ll look into it.",
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
      // Sólo lo que entra en el programa trae código: BFQuarantine no (con 100 +
      // 100 sobre 99 se vendería a pérdida), y la tarjeta no se enseña.
      pintaRecomendacion(v.recomendacion);
      pintaPasarse(v.mejora);
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
  /* ── Pasarse a BotFactoryFX (03-10-2026) ──────────────────────────────────
     Sólo en un pedido de BFQuarantine. Su número es el que da el descuento, y
     esta página ya lo tiene: no se teclea en ningún sitio, ni viaja en un
     enlace. El precio lo dice la tienda (/estado), no esta página. */
  const pasarse = document.getElementById("pasarse");
  const botonPasarse = document.getElementById("pasarse-boton");
  function pintaPasarse(m) {
    if (!pasarse) return;
    pasarse.hidden = !m;
    if (!m) return;
    const precio = String(Number(m.precio));
    for (const s of pasarse.querySelectorAll(".precio")) s.textContent = precio;
    botonPasarse.hidden = Boolean(m.usada);
    document.getElementById("pasarse-usada").hidden = !m.usada;
  }
  if (botonPasarse) {
    botonPasarse.addEventListener("click", async () => {
      const error = document.getElementById("pasarse-error");
      error.hidden = true;
      const dice = botonPasarse.innerHTML;
      botonPasarse.disabled = true;
      botonPasarse.textContent = T.creando;
      try {
        const r = await fetch(`${API}/comprar`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ producto: "fx", mejora: pedido }),
        });
        const v = await r.json();
        if (!v || !v.pagar) throw new Error(v && v.motivo ? v.motivo : "sin factura");
        // Plisio vuelve a /descarga/, la inglesa: que sepa en qué lengua se compró.
        try { sessionStorage.setItem("bfx-web-idioma", ES ? "es" : "en"); } catch { /* nada */ }
        location.href = v.pagar;
      } catch (e) {
        botonPasarse.innerHTML = dice;
        botonPasarse.disabled = false;
        error.textContent = e.message === "mejora-usada" ? T.mejoraUsada
          : e.message === "mejora-no-vale" ? T.mejoraNoVale : T.sinConexion;
        error.hidden = false;
      }
    });
  }

  /* ── La recomendación ────────────────────────────────────────────────── */
  const recomendar = document.getElementById("recomendar");
  const formulario = document.getElementById("cobro");
  const hecho = document.getElementById("cobro-hecho");
  const errorCobro = document.getElementById("cobro-error");
  const botonGuardar = document.getElementById("cobro-guardar");
  let cambiando = false;

  function pintaRecomendacion(r) {
    if (!recomendar) return;
    recomendar.hidden = !r;
    if (!r) return;
    document.getElementById("enlace-ref").textContent = `${SITIO}${T.ref}?ref=${r.codigo}`;
    document.getElementById("codigo-ref").textContent = r.codigo;

    // Con dirección: se dice a dónde se paga, y se puede cambiar mientras
    // queden veces. Sin ella, o cambiándola: el formulario.
    const conDireccion = Boolean(r.cobro) && !cambiando;
    hecho.hidden = !conDireccion;
    formulario.hidden = conDireccion;
    if (r.cobro) {
      document.getElementById("cobro-hecho-tron").textContent = r.cobro.tron;
      document.getElementById("cobro-hecho-correo").textContent = r.cobro.correo;
      document.getElementById("cobro-tron").value = r.cobro.tron;
      document.getElementById("cobro-correo").value = r.cobro.correo;
    }
    document.getElementById("cobro-cambiar").hidden = r.cambiosRestantes === 0;
    document.getElementById("cobro-sin-cambios").hidden = r.cambiosRestantes !== 0;
    const espera = document.getElementById("cobro-pendiente");
    espera.hidden = Boolean(r.cobro) || !(Number(r.pendiente) > 0);
    if (!espera.hidden) espera.textContent = T.pendienteSinDireccion(r.pendiente);

    const ventas = document.getElementById("ya-recomendadas");
    ventas.hidden = !(r.ventas > 0);
    if (r.ventas > 0) ventas.textContent = T.ventas(r);

    const lista = document.getElementById("pagos");
    lista.replaceChildren();
    for (const p of r.pagos || []) {
      const li = document.createElement("li");
      li.append(T.pago(p));
      const a = document.createElement("a");
      a.href = `https://tronscan.org/#/transaction/${encodeURIComponent(p.tx)}`;
      a.rel = "noreferrer";
      a.textContent = T.verTx;
      li.append(a);
      lista.append(li);
    }
    lista.hidden = !(r.pagos && r.pagos.length);
  }

  document.getElementById("cobro-cambiar").addEventListener("click", () => {
    cambiando = true;
    hecho.hidden = true;
    formulario.hidden = false;
    document.getElementById("cobro-tron").focus();
  });

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tron = document.getElementById("cobro-tron").value.trim();
    const correo = document.getElementById("cobro-correo").value.trim();
    const falla = (texto) => { errorCobro.textContent = texto; errorCobro.hidden = false; };
    errorCobro.hidden = true;
    // Lo que se ve a simple vista se dice sin preguntar a nadie; la suma de
    // control de la dirección la comprueba la tienda.
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(tron)) { falla(T.errores.direccion); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { falla(T.errores.correo); return; }
    botonGuardar.disabled = true;
    botonGuardar.textContent = T.guardando;
    try {
      const r = await fetch(`${API}/cobro`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ pedido, tron, correo, lengua: ES ? "es" : "en" }),
      });
      const v = await r.json();
      if (r.ok && v.recomendacion) {
        cambiando = false;
        pintaRecomendacion(v.recomendacion);
      } else {
        falla(T.errores[v && v.error] || T.errores.otro);
      }
    } catch {
      falla(T.sinConexion);
    }
    botonGuardar.disabled = false;
    botonGuardar.textContent = T.guardar;
  });

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
