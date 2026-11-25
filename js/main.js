import { createElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.jsx";
import { redirects, routeFor } from "./routes.js";
import "@astryxdesign/theme-butter/fonts.css";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import "@astryxdesign/theme-butter/theme.css";
import "../css/style.css";
import "../css/responsive.css";

const filename = window.location.pathname.split("/").at(-1);
const redirect = Object.hasOwn(redirects, filename) ? redirects[filename] : null;
if (redirect) {
  window.location.replace(redirect.href);
} else {
  const route = routeFor(window.location.pathname);
  const root = document.getElementById("app");
  const app = createElement(App, { route });
  document.title = route.title;
  if (root.firstElementChild) {
    hydrateRoot(root, app);
  } else {
    createRoot(root).render(app);
  }
}
