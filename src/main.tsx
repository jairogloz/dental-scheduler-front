import { createRoot } from "react-dom/client";
import "./index.css";
import AppRouter from "./AppRouter";

console.log("🌟 Main.tsx - App is starting up");

createRoot(document.getElementById("root")!).render(<AppRouter />);
