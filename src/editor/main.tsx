import React from "react";
import ReactDOM from "react-dom/client";
import { Agentation } from "agentation";
import { Editor } from "./Editor";
import "../globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Editor />
    {import.meta.env.VITE_AGENTATION === "true" && <Agentation />}
  </React.StrictMode>
);
