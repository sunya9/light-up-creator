import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { usePuzzleStock } from "@/hooks/usePuzzleStock";
import { fromUrlHash } from "@/lib/lightup/serializer";

export function Importer() {
  const { hash } = useParams<{ hash: string }>();
  const [, navigate] = useLocation();
  const stock = usePuzzleStock();

  useEffect(() => {
    if (!hash) {
      navigate("/", { replace: true });
      return;
    }
    const grid = fromUrlHash(hash);
    if (!grid) {
      navigate("/", { replace: true });
      return;
    }
    const id = crypto.randomUUID();
    stock.upsert(id, grid);
    navigate(`/edit/${id}`, { replace: true });
  }, [hash, navigate, stock]);

  return null;
}
