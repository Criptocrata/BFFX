/// <reference lib="webworker" />
//
// The Reality Check, off the main thread.
//
// Twelve checks over a real dataset come to roughly eighty backtests — the same
// order of work as a genetic search, and the same reason to keep it away from
// the interface. Progress is reported per check so a long verdict shows where
// it has got to rather than looking hung.

import { runRealityCheck, type RealityCheckReport } from "@/lib/application/reality-check";
import { seriesFromBuffer, type Series } from "@bfx/engine/domain/series";
import type { InstrumentSpec } from "@bfx/engine/domain/instrument";
import type { Candle, CostModel, Strategy } from "@bfx/engine/domain/types";

interface RealityCheckCommon {
  strategy: Strategy;
  costs: CostModel;
  /** Qué instrumento es el sujeto. Ausente, se deduce del símbolo. */
  instrument?: InstrumentSpec | null;
  seed?: number;
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
}

/** What a caller asks for: the series it already holds. */
export interface RealityCheckRequest extends RealityCheckCommon {
  candles: Series;
  /** See `nativeBuffer` — passed only when it is finer than `candles`. */
  nativeSeries?: Series;
  /** See `otherBuffers`. */
  otherInstruments?: { symbol: string; series: Series; costs: CostModel; instrument?: InstrumentSpec | null }[];
}

export type RealityCheckWorkerMessage =
  | { type: "progress"; done: number; total: number; justFinished: string }
  | { type: "done"; report: RealityCheckReport }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<RealityCheckWorkerRequest>) => {
  const { strategy, candlesBuffer, nativeBuffer, otherBuffers, costs, instrument, seed } = event.data;
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

  try {
    const report = runRealityCheck(strategy, candles, {
      nativeSeries,
      otherInstruments,
      costs,
      instrument,
      seed,
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
