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
  strategy: Strategy;
  candlesBuffer: ArrayBuffer;
  costs?: CostModel;
  /** La ficha viaja como objeto plano, que es clonable sin más. */
  instrument?: InstrumentSpec | null;
}

export type BacktestWorkerMessage =
  | { type: "done"; result: BacktestResult }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", (event: MessageEvent<BacktestWorkerRequest>) => {
  const { strategy, candlesBuffer, costs, instrument } = event.data;
  try {
    const result = runBacktest(strategy, seriesFromBuffer(candlesBuffer), { costs, instrument });
    ctx.postMessage({ type: "done", result } satisfies BacktestWorkerMessage);
  } catch (error) {
    ctx.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    } satisfies BacktestWorkerMessage);
  }
});
