/// <reference lib="webworker" />
//
// The genetic search, off the main thread.
//
// A real dataset costs about 100 ms per evaluation, and a balanced run is 840
// of them — a minute and a half of solid CPU. Yielding between evaluations
// keeps the page technically responsive, but the tab still crawls and the
// browser still warns that the page is slowing things down. The only honest fix
// is to stop doing arithmetic where the interface lives.

import { runGeneticAlgorithm, type GAConfig, type GenerationStats } from "@/lib/application/genetic-builder";
import { seriesFromBuffer, seriesFromCandles, type Series } from "@/lib/domain/series";
import type { Candle, Strategy } from "@/lib/domain/types";

/** Everything about a run except which series it is over. */
export interface GaRunParams {
  config: GAConfig;
  symbol: string;
  timeframe: string;
  startingBalance: number;
  referenceSeries?: Record<string, Candle[]>;
  seedStrategy?: Strategy | null;
}

/**
 * What a caller asks for: the series as candles, because that is what a caller
 * has in hand.
 */
export interface GaRunRequest extends GaRunParams {
  candles: Series;
}

/**
 * What actually crosses into the worker: the series columnar. See
 * `candle-codec`.
 *
 * This used to be the caller's `Candle[]`, and structured clone charged for it
 * by the object: 8.4 million bars measured 1,162 MB as objects and took 21
 * seconds and another 1,425 MB to copy — per island, before any arithmetic
 * began. The same bars as a binary buffer are 48 bytes each instead of 144,
 * the clone is a memcpy, and the buffer is transferred rather than copied, so
 * the sender's memory is handed over instead of duplicated.
 */
export interface GaWorkerRequest extends GaRunParams {
  candlesBuffer: ArrayBuffer;
}

export type GaWorkerMessage =
  | { type: "generation"; stats: GenerationStats }
  | { type: "done"; result: Awaited<ReturnType<typeof runGeneticAlgorithm>> }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", async (event: MessageEvent<GaWorkerRequest>) => {
  const { candlesBuffer, config, symbol, timeframe, startingBalance, referenceSeries, seedStrategy } = event.data;
  // A view over the buffer that was just transferred in — no decode, no copy,
  // no objects. On the 8.4-million-bar series this line used to cost 1,162 MB
  // and about twenty seconds; it now costs six typed-array headers.
  const candles = seriesFromBuffer(candlesBuffer);

  try {
    const result = await runGeneticAlgorithm(
      candles,
      config,
      symbol,
      timeframe,
      startingBalance,
      (stats) => ctx.postMessage({ type: "generation", stats } satisfies GaWorkerMessage),
      // Small by nature — a higher-timeframe filter, not the traded series — so
      // these still cross as objects and are converted here.
      referenceSeries && Object.fromEntries(
        Object.entries(referenceSeries).map(([id, c]) => [id, seriesFromCandles(c)]),
      ),
      seedStrategy ?? null,
    );
    ctx.postMessage({ type: "done", result } satisfies GaWorkerMessage);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    } satisfies GaWorkerMessage);
  }
});
