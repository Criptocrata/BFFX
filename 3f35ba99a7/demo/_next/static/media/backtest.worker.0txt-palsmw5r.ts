/// <reference lib="webworker" />
//
// One backtest, off the interface thread.
//
// The engine is fast — about 0.8 µs a bar — but "fast" stops meaning anything
// once the series is large enough. A backtest over the 8.4-million-bar EURUSD
// M1 file is roughly seven seconds of solid arithmetic, and five screens ran it
// synchronously inside a click or a render: the Explore screen even fired one
// automatically 250 ms after mounting. Seven seconds with no repaint is not a
// slow app, it is a hung one, and it was reported as a hang.
//
// The series crosses as an encoded buffer and is transferred, so nothing is
// copied and nothing is materialised as objects — same arrangement as the
// genetic and Reality Check workers.

import { runBacktest } from "@bfx/engine/sim/run-backtest";
import { seriesFromBuffer } from "@bfx/engine/domain/series";
import type { BacktestResult, CostModel, Strategy } from "@bfx/engine/domain/types";
import type { InstrumentSpec } from "@bfx/engine/domain/instrument";

export interface BacktestWorkerRequest {
  /** Para emparejar la respuesta con su petición: el worker ya no es de usar y tirar. */
  id: number;
  /**
   * Nula para decir «quédate la serie y no corras nada».
   *
   * Es el precalentamiento: una pantalla que se abre con un histórico cargado
   * sabe ya que va a hacer falta, y así la primera interacción del usuario no es
   * la que paga arrancar el worker y montar la serie.
   */
  strategy: Strategy | null;
  candlesBuffer: ArrayBuffer;
  costs?: CostModel;
  /** La ficha viaja como objeto plano, que es clonable sin más. */
  instrument?: InstrumentSpec | null;
}

export type BacktestWorkerMessage =
  | { type: "done"; id: number; result: BacktestResult }
  | { type: "error"; id: number; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/* La serie de la última petición, guardada.
 *
 * El Laboratorio corre el mismo histórico una y otra vez cambiando un parámetro,
 * y hasta ahora cada pasada transfería el buffer entero —6,7 MB sobre 140.173
 * velas— y volvía a montar la serie encima. Guardarla mientras no cambie ahorra
 * eso en cada movimiento del deslizador.
 *
 * Se compara por tamaño y no por contenido: el buffer llega transferido, o sea
 * que quien lo mandó ya no lo tiene, y comparar 6,7 MB byte a byte costaría más
 * que rehacer la serie. Quien llama manda el buffer sólo cuando la serie ha
 * cambiado de verdad — ver `run-backtest-offthread.ts`. */
let serieGuardada: ReturnType<typeof seriesFromBuffer> | null = null;

ctx.addEventListener("message", (event: MessageEvent<BacktestWorkerRequest>) => {
  const { id, strategy, candlesBuffer, costs, instrument } = event.data;
  try {
    if (candlesBuffer.byteLength > 0) serieGuardada = seriesFromBuffer(candlesBuffer);
    if (!strategy) return;   // precalentamiento: la serie ya está montada
    if (!serieGuardada) throw new Error("No hay velas en el worker todavía.");
    const result = runBacktest(strategy, serieGuardada, { costs, instrument });
    ctx.postMessage({ type: "done", id, result } satisfies BacktestWorkerMessage);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      id,
      message: error instanceof Error ? error.message : String(error),
    } satisfies BacktestWorkerMessage);
  }
});
