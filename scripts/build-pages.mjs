import { readFile, writeFile } from "node:fs/promises";
import { calculateFinalPrice, redirects, render, routes } from "../.ssr/entry-server.js";

const site = new URL(process.env.SITE_URL || "https://lev294.github.io/kr1-html-css-shop/");
site.pathname = site.pathname.replace(/\/?$/, "/");
site.search = "";
site.hash = "";
const template = await readFile("dist/index.html", "utf8");

function canonical(file) {
  return new URL(file === "index.html" ? "./" : file, site).href;
}

function escapeHTML(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function structuredData(route) {
  const graph = [];
  if (route.crumbs) {
    const items = [...route.crumbs, [route.file, route.name]];
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: items.map(([file, name], index) => ({
        "@type": "ListItem", position: index + 1, name, item: canonical(file),
      })),
    });
  }
  if (route.product) {
    const product = route.product;
    graph.push({
      "@type": "Product", name: product.name, sku: product.code,
      description: product.description, image: new URL(product.image, site).href,
      offers: {
        "@type": "Offer", url: canonical(route.file), priceCurrency: "RUB",
        price: calculateFinalPrice(product),
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
    });
  }
  if (!graph.length) return "";
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

for (const route of routes) {
  const meta = [
    `<meta name="description" content="${escapeHTML(route.description)}">`,
    route.noindex ? '<meta name="robots" content="noindex, follow">' : `<link rel="canonical" href="${escapeHTML(canonical(route.file))}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="ru_RU">',
    '<meta property="og:site_name" content="ShopProject">',
    `<meta property="og:title" content="${escapeHTML(route.title)}">`,
    `<meta property="og:description" content="${escapeHTML(route.description)}">`,
    `<meta property="og:url" content="${escapeHTML(canonical(route.file))}">`,
    `<meta property="og:image" content="${escapeHTML(new URL("images/desk-social.jpg", site).href)}">`,
    '<meta property="og:image:alt" content="Клавиатура и мышь на рабочем столе">',
    route.noindex ? "" : structuredData(route),
  ].join("\n  ");
  const html = template.replace("<title>ShopProject</title>", () => `<title>${escapeHTML(route.title)}</title>`)
    .replace("<!--page-meta-->", () => meta)
    .replace("<!--app-->", () => render(route));
  await writeFile(`dist/${route.file}`, html);
}

// Старые адреса остаются рабочими и не дублируют содержимое в поиске.
for (const [file, redirect] of Object.entries(redirects)) {
  const target = escapeHTML(redirect.href);
  await writeFile(`dist/${file}`, `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(redirect.label)} — ShopProject</title>
  <meta name="robots" content="noindex, follow">
  <meta http-equiv="refresh" content="0; url=${target}">
  <link rel="canonical" href="${escapeHTML(canonical(redirect.canonical))}">
</head>
<body><main><a href="${target}">${escapeHTML(redirect.label)}</a></main></body>
</html>
`);
}

const urls = routes.filter((route) => !route.noindex)
  .map((route) => `  <url><loc>${escapeHTML(canonical(route.file))}</loc></url>`);
await writeFile("dist/sitemap.xml", [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls, "</urlset>", "",
].join("\n"));
await writeFile("dist/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${new URL("sitemap.xml", site).href}\n`);
console.log(`React сформировал ${routes.length} HTML-страниц и sitemap.xml.`);
