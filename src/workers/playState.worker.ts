import type { PuzzleDef } from "../lib/lightup/types";
import { computePlayState } from "../lib/lightup/playState";

export interface PlayStateRequest {
  grid: PuzzleDef;
  bulbs: string[];
}

export interface PlayStateResponse {
  conflicts: string[];
  numberErrors: string[];
  isSolved: boolean;
}

self.onmessage = (e: MessageEvent<PlayStateRequest>) => {
  const { grid, bulbs } = e.data;
  const bulbSet = new Set(bulbs);
  const result = computePlayState(grid, bulbSet);
  const response: PlayStateResponse = {
    conflicts: Array.from(result.conflicts),
    numberErrors: Array.from(result.numberErrors),
    isSolved: result.isSolved,
  };
  self.postMessage(response);
};
