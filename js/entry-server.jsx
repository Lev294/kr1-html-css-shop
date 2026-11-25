import { renderToString } from "react-dom/server";
import App from "./App.jsx";
export { routes } from "./routes.js";
export { calculateFinalPrice } from "./data.js";

export function render(route) {
  return renderToString(<App route={route} />);
}
