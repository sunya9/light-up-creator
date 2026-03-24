import * as v from "valibot";

export const StockedPuzzleSchema = v.object({
  id: v.string(),
  name: v.string(),
  data: v.string(),
  posted: v.boolean(),
  createdAt: v.number(),
});

export type StockedPuzzle = v.InferOutput<typeof StockedPuzzleSchema>;

export const StockArraySchema = v.array(StockedPuzzleSchema);
