import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PuzzleStockProvider } from "./hooks/usePuzzleStock";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PuzzleStockProvider>
      <App />
    </PuzzleStockProvider>
  </StrictMode>,
);
