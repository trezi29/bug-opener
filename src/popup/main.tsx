import React from "react";
import ReactDOM from "react-dom/client";
import { Agentation } from "agentation";
import { Popup } from "./Popup";
import "../globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
    {import.meta.env.VITE_AGENTATION === "true" && <Agentation />}
  </React.StrictMode>
);
