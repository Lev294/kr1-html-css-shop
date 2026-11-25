import { createElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import { routeFor } from "./routes.js";
import "../css/style.css";
import "../css/responsive.css";

const route = routeFor(window.location.pathname);
const root = document.getElementById("app");
const app = createElement(App, { route });

document.title = route.title;
if (root.firstElementChild) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
