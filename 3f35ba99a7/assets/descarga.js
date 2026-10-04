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
        precio: (x) => `${usdt(x)} USD`,
        vienesRecomendado: "Vienes recomendado: el descuento ya va en el precio.",
        confirmando: (moneda, n) => {
          const tarda = moneda === "BTC" ? "con Bitcoin suele llevar de 10 a 60 minutos, y con una comisión baja, horas; el pago no se pierde, y te escribiremos en cuanto se confirme"
            : moneda === "USDT_TRX" || moneda === "TRX" ? "con TRON es cosa de un minuto" : "suele tardar unos minutos";
          const lleva = typeof n === "number" && n > 0 ? ` Lleva ${n} ${n === 1 ? "confirmación" : "confirmaciones"}.` : "";
          return `La red lo está confirmando: ${tarda}.${lleva}`;
        },
        teEscribiremos: (c) => `En cuanto se confirme el pago te escribimos a ${c} con el enlace de esta página.`,
        sinCobro: "El cobro no contesta ahora mismo. Inténtalo en un minuto, o escríbenos a botfactoryfx@proton.me y te mandamos la factura a mano.",
        mejoraUsada: "Este pedido ya se usó para pasarse a BotFactoryFX.",
        numeroMal: "Eso no parece un número de pedido: empieza por BFX o BFQ y lleva dos grupos de ocho letras y cifras.",
        noEsNuestro: "Ese número no es de ningún pedido nuestro. Revisa que esté entero, o escríbenos.",
        copiado: "Copiado",
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
        precio: (x) => `$${usdt(x)}`,
        vienesRecomendado: "You were referred: the discount is already in the price.",
        confirmando: (moneda, n) => {
          const tarda = moneda === "BTC" ? "with Bitcoin it usually takes 10 to 60 minutes, and with a low fee, hours; the payment isn’t lost, and we’ll email you as soon as it confirms"
            : moneda === "USDT_TRX" || moneda === "TRX" ? "on TRON it takes about a minute" : "it usually takes a few minutes";
          const lleva = typeof n === "number" && n > 0 ? ` ${n} ${n === 1 ? "confirmation" : "confirmations"} so far.` : "";
          return `The network is confirming it: ${tarda}.${lleva}`;
        },
        teEscribiremos: (c) => `As soon as the payment confirms we email ${c} the link to this page.`,
        sinCobro: "Checkout isn’t answering right now. Try again in a minute, or write to botfactoryfx@proton.me and we’ll send you the invoice by hand.",
        mejoraUsada: "This order has already been used to move up to BotFactoryFX.",
        mejoraNoVale: "This order doesn’t carry the discount. Write to us with your order number and we’ll look into it.",
        ref: "",
        numeroMal: "That doesn’t look like an order number: it starts with BFX or BFQ and has two groups of eight letters and digits.",
        noEsNuestro: "That number isn’t one of our orders. Check that it’s complete, or write to us.",
        copiado: "Copied",
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

  const params = new URLSearchParams(location.search);
  /* «l=es» lo pone la tienda en la vuelta de Plisio y en el correo al
     comprador (04-10-2026): la página de la raíz ya hizo con él lo suyo —pasar
     a la castellana—, y arrastrado haría que «EN» volviera aquí. */
  if (params.has("l")) {
    params.delete("l");
    try { history.replaceState(null, "", location.pathname + (params.toString() ? `?${params}` : "") + location.hash); } catch { /* nada */ }
  }
  const pedido = (params.get("p") || "").trim().toUpperCase();
  /* La factura de Plisio, cuando se llega aquí ANTES de pagar (04-10-2026): la
     web manda primero a esta página, con su número y su dirección para
     guardarla, y desde aquí se paga. Sólo si es de Plisio: un «pagar» de otro
     sitio no se convierte en botón, que un enlace así se puede fabricar. */
  const pagar = (() => {
    try {
      const u = new URL(params.get("pagar") || "");
      return u.protocol === "https:" && (u.hostname === "plisio.net" || u.hostname.endsWith(".plisio.net")) ? u.toString() : null;
    } catch { return null; }
  })();
  /* La dirección para guardar: ésta, sin la factura. */
  const enlaceCompra = (() => { const u = new URL(location.href); u.searchParams.delete("pagar"); u.hash = ""; return u.toString(); })();
  const otro = document.getElementById("otro-idioma");
  if (otro) {
    otro.href = otro.getAttribute("href") + location.search;
    // Cambiar de lengua aquí es elegirla: sin esto la inglesa devolvería a la
    // española por la marca que dejó la compra.
    otro.addEventListener("click", () => { try { sessionStorage.setItem("bfx-web-idioma", ES ? "en" : "es"); } catch { /* nada */ } });
  }
  const ver = (id) => {
    for (const s of ["comprar", "sin-pedido", "por-pagar", "cargando", "confirmando", "esperando", "listo", "revisar", "cerrado"]) {
      const el = document.getElementById(s);
      if (el) el.hidden = s !== id;
    }
  };

  /* Quien llega sin número, o con uno que no es nuestro, lo escribe aquí
     (04-10-2026): el correo de Plisio trae el número, no esta página. Se
     acepta pegado de cualquier manera —en minúsculas, con espacios o la
     dirección entera—: se busca el número dentro. */
  const buscar = document.getElementById("buscar-pedido");
  const numeroError = document.getElementById("numero-error");
  const casilla = document.getElementById("numero");
  if (buscar) {
    buscar.addEventListener("submit", (e) => {
      e.preventDefault();
      const m = (casilla.value || "").toUpperCase().replace(/\s+/g, "").match(/BF[XQ]-[2-9A-HJ-NP-Z]{8}-[2-9A-HJ-NP-Z]{8}/);
      if (!m) { numeroError.textContent = T.numeroMal; numeroError.hidden = false; return; }
      const u = new URL(location.href); u.search = ""; u.hash = ""; u.searchParams.set("p", m[0]);
      location.href = u.toString();
    });
  }
  const sinPedido = (motivo) => {
    if (motivo && numeroError) { numeroError.textContent = motivo; numeroError.hidden = false; }
    if (casilla && pedido) casilla.value = pedido;
    ver("sin-pedido");
  };
  /* ── Comprar (04-10-2026) ────────────────────────────────────────────────
     El botón de la web trae aquí lo que se compra. Se enseña con su precio
     —el de verdad, con el descuento de quien recomendó si lo hay—, se pide el
     correo al que irá el enlace de esta página cuando se confirme el pago, y
     sólo entonces se crea la factura, con el correo ya puesto para que Plisio
     no lo pida otra vez. */
  const queCompra = params.get("comprar");
  if (!pedido && (queCompra === "fx" || queCompra === "quarantine")) {
    montarCompra(queCompra, (params.get("ref") || "").trim().toUpperCase());
    return;
  }
  function montarCompra(producto, ref) {
    const NOMBRES = { fx: "BotFactoryFX", quarantine: "BFQuarantine" };
    document.getElementById("comprar-producto").textContent = NOMBRES[producto];
    const q = new URLSearchParams({ producto });
    if (ref) q.set("ref", ref);
    fetch(`${API}/recomendacion?${q}`)
      .then((r) => r.json())
      .then((v) => {
        if (v && v.precio) document.getElementById("comprar-precio").textContent = T.precio(v.precio);
        if (v && v.vale) {
          const nota = document.getElementById("comprar-recomendado");
          nota.textContent = T.vienesRecomendado;
          nota.hidden = false;
        }
      })
      .catch(() => { /* el precio sale en la factura igualmente */ });
    const formulario = document.getElementById("comprar-form");
    /* Quien elige Bitcoin lee antes de pagar que puede tardar horas (04-10-2026):
       la tercera compra de prueba pasó de la hora, y sin aviso eso parece un fallo. */
    const avisoBtc = document.getElementById("aviso-btc");
    const pintaAviso = () => {
      const marcada = formulario.querySelector('input[name="moneda"]:checked');
      if (avisoBtc) avisoBtc.hidden = !marcada || marcada.value !== "BTC";
    };
    formulario.addEventListener("change", pintaAviso);
    pintaAviso();
    const casilla = document.getElementById("comprar-correo");
    const error = document.getElementById("comprar-error");
    const seguir = document.getElementById("comprar-seguir");
    formulario.addEventListener("submit", async (e) => {
      e.preventDefault();
      error.hidden = true;
      const correo = (casilla.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
        error.textContent = T.errores.correo; error.hidden = false; casilla.focus();
        return;
      }
      const dice = seguir.textContent;
      seguir.disabled = true;
      seguir.textContent = T.creando;
      try {
        const marcada = formulario.querySelector('input[name="moneda"]:checked');
        const elegida = marcada ? marcada.value : "";
        const cuerpo = { producto, correo, lengua: ES ? "es" : "en", moneda: elegida };
        if (ref) cuerpo.ref = ref;
        const r = await fetch(`${API}/comprar`, {
          method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo),
        });
        const v = await r.json().catch(() => null);
        if (v && v.error === "correo") throw new Error("correo");
        if (!r.ok || !v || !v.pagar || !v.pedido) throw new Error("sin factura");
        // Para decirle, en el paso de pagar, a dónde le escribiremos. Sólo en esta pestaña.
        try { sessionStorage.setItem(`bfx-correo-${v.pedido}`, correo); } catch { /* nada */ }
        const u = new URL(location.href); u.search = ""; u.hash = "";
        u.searchParams.set("p", v.pedido);
        u.searchParams.set("pagar", v.pagar);
        location.replace(u.toString());
      } catch (err) {
        error.textContent = err && err.message === "correo" ? T.errores.correo : T.sinCobro;
        error.hidden = false;
        seguir.disabled = false;
        seguir.textContent = dice;
      }
    });
    ver("comprar");
  }

  if (!/^BF[XQ]-[2-9A-HJ-NP-Z]{8}-[2-9A-HJ-NP-Z]{8}$/.test(pedido)) { sinPedido(pedido ? T.numeroMal : null); return; }
  for (const el of document.querySelectorAll(".num")) el.textContent = pedido;

  /* El paso de pagar: la dirección para guardar, copiarla, y el botón a la factura. */
  const elEnlace = document.getElementById("enlace-compra");
  if (elEnlace) elEnlace.textContent = enlaceCompra;
  const botonPagar = document.getElementById("pagar");
  if (botonPagar && pagar) botonPagar.href = pagar;
  const correoDeLaCompra = (() => { try { return sessionStorage.getItem(`bfx-correo-${pedido}`); } catch { return null; } })();
  const avisoDeCorreo = document.getElementById("por-pagar-correo");
  if (avisoDeCorreo && correoDeLaCompra) { avisoDeCorreo.textContent = T.teEscribiremos(correoDeLaCompra); avisoDeCorreo.hidden = false; }
  const copiar = document.getElementById("copiar-enlace");
  if (copiar) {
    copiar.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(enlaceCompra); copiar.textContent = T.copiado; }
      catch { /* el enlace se puede seleccionar a mano: .licencia lleva user-select: all */ }
    });
  }
  /* Resuelto el pedido —pagado, cerrado o para revisar—, la factura sobra en la dirección. */
  const sinFactura = () => { if (pagar) { try { history.replaceState(null, "", enlaceCompra); } catch { /* nada */ } } };

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
      sinFactura();
      ver("listo");
      return;
    }
    if (v.estado === "revisar") { sinFactura(); ver("revisar"); return; }
    if (v.estado === "cerrado") { sinFactura(); ver("cerrado"); return; }
    if (v.estado === "desconocido") { sinPedido(T.noEsNuestro); return; }
    /* Plisio ya vio el pago y la red lo confirma (04-10-2026): «pago recibido»,
       con lo que suele tardar esa moneda y las confirmaciones que lleva, y se
       mira más a menudo, que el cambio a la descarga está al caer. */
    if (v.estado === "confirmando") {
      const texto = document.getElementById("confirmando-texto");
      if (texto) texto.textContent = T.confirmando(v.moneda, v.confirmaciones);
      sinFactura();
      ver("confirmando");
      espera = Math.min(espera * 1.2, 20_000);
      setTimeout(mirar, espera);
      return;
    }
    // Con la factura en la mano, el paso de pagar; sin ella, ya pagó y espera a la red.
    ver(pagar ? "por-pagar" : "esperando");
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
          body: JSON.stringify({ producto: "fx", mejora: pedido, lengua: ES ? "es" : "en" }),
        });
        const v = await r.json();
        if (!v || !v.pagar || !v.pedido) throw new Error(v && v.motivo ? v.motivo : "sin factura");
        // Plisio vuelve a /descarga/, la inglesa: que sepa en qué lengua se compró.
        try { sessionStorage.setItem("bfx-web-idioma", ES ? "es" : "en"); } catch { /* nada */ }
        /* A la página del pedido NUEVO, con su factura, y no derecho a Plisio
           (04-10-2026): el mismo paso de pagar que trae la web. */
        const nueva = new URL(location.href); nueva.search = ""; nueva.hash = "";
        nueva.searchParams.set("p", v.pedido); nueva.searchParams.set("pagar", v.pagar);
        location.href = nueva.toString();
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
