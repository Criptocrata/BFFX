/* El QR del pago (11-11-2026). El dueño: «me gustaría que hubiera código QR. Iba a pagar con el móvil (que es lo que
   hará mucha gente) y resulta engorroso no tener qr». Lo carga descarga.js sólo cuando hay un pago directo que
   enseñar: la dirección de TRON, o el enlace «bitcoin:» con la dirección y la cantidad.

   La librería es la misma que dibuja el QR de «Ver en el móvil» (src/lib/emparejar/vendor/LEEME.md): qrcode-generator
   2.0.4, MIT, copiada tal cual y con su huella comprobada en las pruebas. Nada se pide a otro sitio. */
import qrcode from "./qrcode-generator.js";

/** Los módulos del QR de un texto, fila a fila: true es negro. Corrección M, como el de «Ver en el móvil». */
export function matrizQR(texto) {
  const qr = qrcode(0, "M");
  qr.addData(String(texto), "Byte");
  qr.make();
  const n = qr.getModuleCount();
  const filas = [];
  for (let f = 0; f < n; f++) {
    const fila = [];
    for (let c = 0; c < n; c++) fila.push(qr.isDark(f, c));
    filas.push(fila);
  }
  return filas;
}

/** El margen blanco que piden los lectores alrededor del QR, en módulos. */
export const BORDE = 4;

/** El dibujo de los módulos negros, un cuadrado de 1×1 por módulo, ya con el margen. */
export function caminoQR(filas) {
  let d = "";
  filas.forEach((fila, f) => fila.forEach((negro, c) => { if (negro) d += `M${c + BORDE} ${f + BORDE}h1v1h-1z`; }));
  return d;
}

/** El QR como SVG, negro sobre blanco también en el tema oscuro: un lector no lee bien al revés. */
export function svgQR(texto, documento = document, titulo = "") {
  const filas = matrizQR(texto);
  const lado = filas.length + 2 * BORDE;
  const NS = "http://www.w3.org/2000/svg";
  const svg = documento.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${lado} ${lado}`);
  svg.setAttribute("shape-rendering", "crispEdges");
  svg.setAttribute("role", "img");
  if (titulo) svg.setAttribute("aria-label", titulo);
  const fondo = documento.createElementNS(NS, "rect");
  fondo.setAttribute("width", String(lado));
  fondo.setAttribute("height", String(lado));
  fondo.setAttribute("fill", "#ffffff");
  const negro = documento.createElementNS(NS, "path");
  negro.setAttribute("d", caminoQR(filas));
  negro.setAttribute("fill", "#000000");
  svg.append(fondo, negro);
  return svg;
}
