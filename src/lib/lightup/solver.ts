import type { PuzzleDef, SolveResult, SolverCell } from "./types";
import { posToKey } from "./types";
import { getVisibleCellsByDirection } from "./illumination";

type SolverState = {
  def: PuzzleDef;
  assignment: Map<string, SolverCell>;
  /** 白マスのキー一覧 */
  whiteCells: string[];
  /** 数字付き黒マスの制約: key → { number, neighbors (白マスキー) } */
  numberConstraints: Map<string, { number: number; neighbors: string[] }>;
  /** 各白マス → 4方向の可視セルリスト */
  illuminationPaths: Map<string, string[][]>;
  /** 各白マスを照らせるセル一覧（自身含む） */
  illuminators: Map<string, string[]>;
};

const ADJACENT = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

function initState(def: PuzzleDef): SolverState {
  const assignment = new Map<string, SolverCell>();
  const whiteCells: string[] = [];
  const numberConstraints = new Map<
    string,
    { number: number; neighbors: string[] }
  >();
  const illuminationPaths = new Map<string, string[][]>();
  const illuminators = new Map<string, string[]>();

  for (let r = 0; r < def.rows; r++) {
    for (let c = 0; c < def.cols; c++) {
      const cell = def.cells[r][c];
      const key = posToKey({ row: r, col: c });
      if (cell.kind === "white") {
        assignment.set(key, "undecided");
        whiteCells.push(key);
        const paths = getVisibleCellsByDirection(def, { row: r, col: c });
        illuminationPaths.set(key, paths);
      } else if (cell.kind === "black" && cell.number !== null) {
        const neighbors: string[] = [];
        for (const d of ADJACENT) {
          const nr = r + d.row;
          const nc = c + d.col;
          if (nr >= 0 && nr < def.rows && nc >= 0 && nc < def.cols) {
            if (def.cells[nr][nc].kind === "white") {
              neighbors.push(posToKey({ row: nr, col: nc }));
            }
          }
        }
        numberConstraints.set(key, { number: cell.number, neighbors });
      }
    }
  }

  // 各白マスを照らせるセルを事前計算（自身 + 4方向の可視白マス）
  for (const key of whiteCells) {
    const sources = [key]; // 自身に bulb を置けば照らされる
    const paths = illuminationPaths.get(key)!;
    for (const dir of paths) {
      for (const cell of dir) {
        sources.push(cell);
      }
    }
    illuminators.set(key, sources);
  }

  return {
    def,
    assignment,
    whiteCells,
    numberConstraints,
    illuminationPaths,
    illuminators,
  };
}

function cloneAssignment(
  assignment: Map<string, SolverCell>,
): Map<string, SolverCell> {
  return new Map(assignment);
}

type PropagateResult =
  | { ok: true; assignment: Map<string, SolverCell> }
  | { ok: false };

function assignCell(
  state: SolverState,
  assignment: Map<string, SolverCell>,
  key: string,
  value: "bulb" | "empty",
): PropagateResult {
  const current = assignment.get(key);
  if (current === value) return { ok: true, assignment };
  if (current !== "undecided") return { ok: false }; // contradiction

  assignment.set(key, value);

  if (value === "bulb") {
    // 衝突チェック: 同一視線上に他の bulb がないか
    const paths = state.illuminationPaths.get(key)!;
    for (const dir of paths) {
      for (const cell of dir) {
        const val = assignment.get(cell);
        if (val === "bulb") return { ok: false }; // conflict
        if (val === "undecided") {
          // この方向の undecided を empty にする（衝突回避）
          assignment.set(cell, "empty");
        }
        // empty → continue
      }
    }
  }

  return { ok: true, assignment };
}

function isIlluminatedWithAssignment(
  key: string,
  assignment: Map<string, SolverCell>,
  illuminationPaths: Map<string, string[][]>,
): boolean {
  if (assignment.get(key) === "bulb") return true;
  const paths = illuminationPaths.get(key)!;
  for (const dir of paths) {
    for (const cell of dir) {
      const val = assignment.get(cell);
      if (val === "bulb") return true;
      if (val !== "empty") break;
    }
  }
  return false;
}

function propagateState(
  state: SolverState,
  assignment: Map<string, SolverCell>,
): PropagateResult {
  let changed = true;
  while (changed) {
    changed = false;

    // 数字制約
    for (const [, constraint] of state.numberConstraints) {
      const { number: n, neighbors } = constraint;
      let bulbCount = 0;
      let undecidedCount = 0;
      const undecided: string[] = [];

      for (const nb of neighbors) {
        const val = assignment.get(nb);
        if (val === "bulb") bulbCount++;
        else if (val === "undecided") {
          undecidedCount++;
          undecided.push(nb);
        }
      }

      if (bulbCount > n) return { ok: false };
      if (bulbCount + undecidedCount < n) return { ok: false };

      if (bulbCount + undecidedCount === n && undecidedCount > 0) {
        for (const u of undecided) {
          const r = assignCell(state, assignment, u, "bulb");
          if (!r.ok) return { ok: false };
        }
        changed = true;
      }

      if (bulbCount === n && undecidedCount > 0) {
        for (const u of undecided) {
          const r = assignCell(state, assignment, u, "empty");
          if (!r.ok) return { ok: false };
        }
        changed = true;
      }
    }

    // 照射チェック
    for (const key of state.whiteCells) {
      if (isIlluminatedWithAssignment(key, assignment, state.illuminationPaths))
        continue;

      const val = assignment.get(key)!;
      const candidates: string[] = [];
      if (val === "undecided") candidates.push(key);

      const paths = state.illuminationPaths.get(key)!;
      for (const dir of paths) {
        for (const cell of dir) {
          const cv = assignment.get(cell);
          if (cv === "bulb") break;
          if (cv === "undecided") {
            candidates.push(cell);
            // empty セルは光を通すので、その先の undecided も候補になりうる
            // → break せず続行
          }
        }
      }

      if (candidates.length === 0) return { ok: false };

      if (candidates.length === 1) {
        const r = assignCell(state, assignment, candidates[0], "bulb");
        if (!r.ok) return { ok: false };
        changed = true;
      }
    }
  }

  return { ok: true, assignment };
}

function isSolved(
  state: SolverState,
  assignment: Map<string, SolverCell>,
): boolean {
  for (const key of state.whiteCells) {
    const val = assignment.get(key)!;
    if (val === "undecided") return false;
    if (!isIlluminatedWithAssignment(key, assignment, state.illuminationPaths))
      return false;
  }
  return true;
}

function chooseBranchCell(
  state: SolverState,
  assignment: Map<string, SolverCell>,
): string | null {
  let bestKey: string | null = null;
  let bestScore = Infinity;

  // 数字制約に隣接する undecided を優先（MRV）
  for (const [, constraint] of state.numberConstraints) {
    const { number: n, neighbors } = constraint;
    let bulbCount = 0;
    const undecided: string[] = [];
    for (const nb of neighbors) {
      const val = assignment.get(nb);
      if (val === "bulb") bulbCount++;
      else if (val === "undecided") undecided.push(nb);
    }
    const remaining = n - bulbCount;
    if (remaining > 0 && undecided.length > 0) {
      const score = undecided.length - remaining; // smaller = more constrained
      if (score < bestScore) {
        bestScore = score;
        bestKey = undecided[0];
      }
    }
  }

  if (bestKey) return bestKey;

  // フォールバック: 最初の undecided
  for (const key of state.whiteCells) {
    if (assignment.get(key) === "undecided") return key;
  }

  return null;
}

function solveRecursive(
  state: SolverState,
  assignment: Map<string, SolverCell>,
  maxSolutions: number,
  solutions: Set<string>[],
): void {
  if (solutions.length >= maxSolutions) return;

  const propResult = propagateState(state, assignment);
  if (!propResult.ok) return;

  if (isSolved(state, assignment)) {
    const bulbs = new Set<string>();
    for (const key of state.whiteCells) {
      if (assignment.get(key) === "bulb") bulbs.add(key);
    }
    solutions.push(bulbs);
    return;
  }

  const cell = chooseBranchCell(state, assignment);
  if (cell === null) return; // no undecided left but not solved → dead end

  // Branch: bulb
  {
    const a = cloneAssignment(assignment);
    const r = assignCell(state, a, cell, "bulb");
    if (r.ok) {
      solveRecursive(state, a, maxSolutions, solutions);
      if (solutions.length >= maxSolutions) return;
    }
  }

  // Branch: empty
  {
    const a = cloneAssignment(assignment);
    const r = assignCell(state, a, cell, "empty");
    if (r.ok) {
      solveRecursive(state, a, maxSolutions, solutions);
    }
  }
}

export function solve(def: PuzzleDef): SolveResult {
  const state = initState(def);

  // 白マスがない場合は自明な解
  if (state.whiteCells.length === 0) {
    return { kind: "unique", solution: new Set() };
  }

  const solutions: Set<string>[] = [];
  const assignment = cloneAssignment(state.assignment);
  solveRecursive(state, assignment, 2, solutions);

  if (solutions.length === 0) return { kind: "none" };
  if (solutions.length === 1) return { kind: "unique", solution: solutions[0] };

  // 2つの解の差分を計算
  const [a, b] = solutions;
  const diff = new Set<string>();
  for (const key of a) {
    if (!b.has(key)) diff.add(key);
  }
  for (const key of b) {
    if (!a.has(key)) diff.add(key);
  }
  return { kind: "multiple", solutions: [a, b], diff };
}
