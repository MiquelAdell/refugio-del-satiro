import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./tokens.css";
import "./reset.css";

createRoot(document.getElementById("root")!).render(
  // StrictMode double-invokes effects in development to detect side-effect bugs.
  // This results in 2x HTTP requests per effect in dev; production builds exclude StrictMode.
  <StrictMode>
    <App />
  </StrictMode>
);
