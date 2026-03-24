import type { PuzzleDef } from "../lib/lightup/types";
import { solve } from "../lib/lightup/solver";

self.onmessage = (e: MessageEvent<PuzzleDef>) => {
  self.postMessage(solve(e.data));
};
