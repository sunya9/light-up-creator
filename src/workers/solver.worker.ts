import type { PuzzleDef } from "../lib/akari/types";
import { solve } from "../lib/akari/solver";

self.onmessage = (e: MessageEvent<PuzzleDef>) => {
  const result = solve(e.data);
  // Set は postMessage でシリアライズできないので変換
  if (result.kind === "unique") {
    self.postMessage({
      kind: "unique",
      solution: Array.from(result.solution),
    });
  } else {
    self.postMessage(result);
  }
};
