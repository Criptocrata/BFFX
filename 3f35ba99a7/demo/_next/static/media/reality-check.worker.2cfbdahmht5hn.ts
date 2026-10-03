/// <reference lib="webworker" />
//
// The Reality Check, off the main thread.
//
// Twelve checks over a real dataset come to roughly eighty backtests — the same
// order of work as a genetic search, and the same reason to keep it away from
// the interface. Progress is reported per check so a long verdict shows where
// it has got to rather than looking hung.

import type { CuentaDeLaCorrida } from "@bfx/engine/sim/moneda-de-la-cuenta";
import type { RelojDeLaSerie } from "@/lib/application/reloj-de-las-series";
import { runRealityCheck, type RealityCheckOptions, type RealityCheckReport } from "@/lib/application/reality-check";
import { seriesFromBuffer, type Series } from "@bfx/engine/domain/series";
import type { InstrumentSpec } from "@bfx/engine/domain/instrument";
import type { Candle, CostModel, Strategy } from "@bfx/engine/domain/types";

interface RealityCheckCommon {
  strategy: Strategy;
  costs: CostModel;
  /** Qué instrumento es el sujeto. Ausente, se deduce del símbolo. */
  instrument?: InstrumentSpec | null;
  seed?: number;
  /** Cuántas estrategias distintas probó la búsqueda. Ver RealityCheckOptions. */
  candidatesTried?: number;
  /** De dónde sale esa cifra, que decide la frase. Ver RealityCheckOptions. */
  procedenciaDeLaCuenta?: RealityCheckOptions["procedenciaDeLaCuenta"];
  /** Otro reparto de pesos, para MIRAR el informe. No cambia el veredicto. */
  pesos?: Record<string, number>;
  /** Lo que el usuario decidió sobre la medición. Éstos sí mandan. */
  trainSplit?: number;
  /** La vela desde la que se juzga; manda sobre `trainSplit`. Ver RealityCheckOptions. */
  judgeFromBar?: number;
  windows?: number;
  resamples?: number;
  shuffles?: number;
  /** El símbolo de la serie que se juzga, si no es el de la estrategia. Ver
   *  RealityCheckOptions. */
  subjectSymbol?: string;
  /** Contrastes de la biblioteca cuyo fichero no se pudo leer. */
  contrastesIlegibles?: string[];
  /** Las otras temporalidades elegidas, en minutos. Ver RealityCheckOptions. */
  temporalidades?: number[];
  /** La moneda de la cuenta y su serie de cambio (28-09-2026): columnas, clonables. */
  cuenta?: CuentaDeLaCorrida | null;
  /** La PBO de la búsqueda que la encontró (29-09-2026). Ver RealityCheckOptions.pbo. */
  pbo?: number | null;
  /** De qué reloj es la serie (29-09-2026, punto 1.6). Ver RealityCheckOptions.reloj. */
  reloj?: RelojDeLaSerie | null;
}

export interface RealityCheckWorkerRequest extends RealityCheckCommon {
  /**
   * The series columnar, as an encoded buffer. Transferred rather than cloned,
   * for the same reason as the genetic worker: as objects this crossing cost
   * 1,418 MB and 1.3 seconds on an 8.4-million-bar series.
   */
  candlesBuffer: ArrayBuffer;
  /**
   * The file's own resolution, when the strategy is being judged on a coarser
   * view of it. Absent when there is nothing finer, which is the common case.
   */
  nativeBuffer?: ArrayBuffer;
  /**
   * Other instruments to try the same rules on, each with its own costs.
   * Empty when the user has only one symbol loaded, which is the common case.
   */
  otherBuffers?: { symbol: string; buffer: ArrayBuffer; costs: CostModel; instrument?: InstrumentSpec | null }[];
  /**
   * Las series que las condiciones nombran por `IndicatorRef.seriesId`, como
   * buffers. Vacío cuando la estrategia no menciona ninguna, que es lo normal.
   *
   * Tienen que cruzar: sin ellas el hilo de trabajo juzga una estrategia a la
   * que le faltan condiciones —evalúan a nada y no se cumplen nunca— mientras
   * el hilo principal la ha medido entera. Un informe sobre otra estrategia,
   * con el nombre de ésta.
   */
  referenceBuffers?: { id: string; buffer: ArrayBuffer }[];
}

/** What a caller asks for: the series it already holds. */
export interface RealityCheckRequest extends RealityCheckCommon {
  candles: Series;
  /** See `nativeBuffer` — passed only when it is finer than `candles`. */
  nativeSeries?: Series;
  /** See `otherBuffers`. */
  otherInstruments?: { symbol: string; series: Series; costs: CostModel; instrument?: InstrumentSpec | null }[];
  /** See `referenceBuffers`. */
  referenceSeries?: Record<string, Series>;
}

export type RealityCheckWorkerMessage =
  | { type: "progress"; done: number; total: number; justFinished: string }
  | { type: "done"; report: RealityCheckReport }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<RealityCheckWorkerRequest>) => {
  const { strategy, candlesBuffer, nativeBuffer, otherBuffers, referenceBuffers, costs, instrument, seed, candidatesTried, procedenciaDeLaCuenta, pesos, trainSplit, judgeFromBar, windows, resamples, shuffles, subjectSymbol, contrastesIlegibles, temporalidades, cuenta, pbo, reloj } = event.data;
  const candles = seriesFromBuffer(candlesBuffer);
  const nativeSeries = nativeBuffer ? seriesFromBuffer(nativeBuffer) : undefined;
  // Laying a Series over a transferred buffer allocates nothing, so this is
  // cheap however many came across — the bounding happened before the send.
  const otherInstruments = (otherBuffers ?? []).map((o) => ({
    symbol: o.symbol,
    series: seriesFromBuffer(o.buffer),
    costs: o.costs,
    instrument: o.instrument,
  }));

  const referenceSeries = referenceBuffers && referenceBuffers.length > 0
    ? Object.fromEntries(referenceBuffers.map((r) => [r.id, seriesFromBuffer(r.buffer)]))
    : undefined;

  try {
    const report = runRealityCheck(strategy, candles, {
      nativeSeries,
      otherInstruments,
      referenceSeries,
      costs,
      instrument,
      seed,
      candidatesTried,
      procedenciaDeLaCuenta,
      pesos,
      trainSplit,
      judgeFromBar,
      windows,
      resamples,
      shuffles,
      subjectSymbol,
      contrastesIlegibles,
      temporalidades,
      cuenta,
      pbo,
      reloj,
      onProgress: (done, total, justFinished) =>
        ctx.postMessage({ type: "progress", done, total, justFinished } satisfies RealityCheckWorkerMessage),
    });
    ctx.postMessage({ type: "done", report } satisfies RealityCheckWorkerMessage);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    } satisfies RealityCheckWorkerMessage);
  }
});
