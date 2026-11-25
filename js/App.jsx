import { useEffect, useState } from "react";
import { products } from "./data.js";
import { BackToTop, Breadcrumbs, Footer, Header } from "./layout.jsx";
import { staticOnly } from "./forms.jsx";
import { AboutPage, CatalogPage, ContactsPage, HomePage, MissingPage, OrderPage, ProductPage } from "./pages.jsx";

export default function App({ route }) {
  const [catalog, setCatalog] = useState(products);
  const usesProducts = ["home", "catalog", "product", "order"].includes(route.view);
  useEffect(() => {
    if (staticOnly || !usesProducts) return;
    const controller = new AbortController();
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) setCatalog(data);
      } catch {
        // Пока API недоступен, используем каталог из сборки.
      }
    }
    loadProducts();
    return () => controller.abort();
  }, [usesProducts]);

  let page;
  switch (route.view) {
    case "home": page = <HomePage products={catalog} />; break;
    case "catalog": page = <CatalogPage route={route} products={catalog} />; break;
    case "product": {
      const product = catalog.find((item) => item.code === route.product.code) || route.product;
      page = <ProductPage product={product} />;
      break;
    }
    case "about": page = <AboutPage />; break;
    case "contacts": page = <ContactsPage />; break;
    case "order": page = <OrderPage products={catalog} />; break;
    default: page = <MissingPage />;
  }

  return <>
    <Header route={route} />
    <main id="main" className={`container main-content${route.view === "home" ? " main-content--home" : ""}`} tabIndex={-1}>
      <Breadcrumbs route={route} />
      {page}
    </main>
    <Footer route={route} />
    <BackToTop />
  </>;
}
