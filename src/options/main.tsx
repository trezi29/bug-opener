import React from "react";
import ReactDOM from "react-dom/client";
import { Agentation } from "agentation";
import { Options } from "./Options";
import "../globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Options />
    {import.meta.env.VITE_AGENTATION === "true" && <Agentation />}
  </React.StrictMode>
);
