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
import type { Candle, Strategy } from "@/lib/domain/types";

export interface GaWorkerRequest {
  candles: Candle[];
  config: GAConfig;
  symbol: string;
  timeframe: string;
  startingBalance: number;
  referenceSeries?: Record<string, Candle[]>;
  seedStrategy?: Strategy | null;
}

export type GaWorkerMessage =
  | { type: "generation"; stats: GenerationStats }
  | { type: "done"; result: Awaited<ReturnType<typeof runGeneticAlgorithm>> }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", async (event: MessageEvent<GaWorkerRequest>) => {
  const { candles, config, symbol, timeframe, startingBalance, referenceSeries, seedStrategy } = event.data;

  try {
    const result = await runGeneticAlgorithm(
      candles,
      config,
      symbol,
      timeframe,
      startingBalance,
      (stats) => ctx.postMessage({ type: "generation", stats } satisfies GaWorkerMessage),
      referenceSeries,
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
