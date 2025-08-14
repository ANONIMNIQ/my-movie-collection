import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <div className="font-space-mono"> {/* Apply font-space-mono here */}
    <App />
  </div>
);