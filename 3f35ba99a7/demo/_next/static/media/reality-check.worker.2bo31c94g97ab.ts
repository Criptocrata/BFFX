/// <reference lib="webworker" />
//
// The Reality Check, off the main thread.
//
// Eight checks over a real dataset come to roughly eighty backtests — the same
// order of work as a genetic search, and the same reason to keep it away from
// the interface. Progress is reported per check so a long verdict shows where
// it has got to rather than looking hung.

import { runRealityCheck, type RealityCheckReport } from "@/lib/application/reality-check";
import type { Candle, CostModel, Strategy } from "@/lib/domain/types";

export interface RealityCheckWorkerRequest {
  strategy: Strategy;
  candles: Candle[];
  costs: CostModel;
  seed?: number;
}

export type RealityCheckWorkerMessage =
  | { type: "progress"; done: number; total: number; justFinished: string }
  | { type: "done"; report: RealityCheckReport }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<RealityCheckWorkerRequest>) => {
  const { strategy, candles, costs, seed } = event.data;

  try {
    const report = runRealityCheck(strategy, candles, {
      costs,
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
