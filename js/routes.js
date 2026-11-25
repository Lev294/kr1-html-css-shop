import { categories, categoryURL, products, productURL } from "./data.js";

export const navigation = [
  ["index.html", "Главная"],
  ["catalog.html", "Каталог"],
  ["about.html", "О магазине и контакты"],
];

export const redirects = {
  "keyboards.html": { href: categoryURL("keyboards"), canonical: "catalog.html", label: "Перейти к клавиатурам" },
  "contacts.html": { href: "about.html#contacts", canonical: "about.html", label: "Перейти к контактам" },
};

const homeCrumb = ["index.html", "Главная"];
const catalogCrumb = ["catalog.html", "Каталог"];
const pages = [
  { file: "index.html", view: "home", name: "Компьютерные аксессуары",
    title: "ShopProject — компьютерные аксессуары",
    description: "Клавиатуры, мыши и аксессуары для рабочего стола. Сравните модели и характеристики в каталоге ShopProject." },
  { file: "catalog.html", view: "catalog", name: "Каталог",
    description: "Девять компьютерных аксессуаров ShopProject: механические и мембранные клавиатуры, мыши, USB-C хаб, коврик и микрофон.",
    crumbs: [homeCrumb] },
  { file: "about.html", view: "about", name: "О магазине и контакты",
    description: "О магазине ShopProject, ассортименте, часах работы и способах связи.",
    crumbs: [homeCrumb] },
  { file: "order.html", view: "order", name: "Заявка",
    description: "Выберите аксессуар и оставьте контактные данные для оформления заявки в ShopProject.",
    crumbs: [homeCrumb, catalogCrumb], noindex: true },
  { file: "404.html", view: "missing", name: "Страница не найдена",
    description: "Вернитесь к каталогу компьютерных аксессуаров ShopProject.",
    crumbs: [homeCrumb], noindex: true },
];

for (const product of products) {
  const category = categories.find((item) => item.id === product.category);
  const crumbs = [homeCrumb, catalogCrumb, [categoryURL(category.id), category.name]];
  pages.push({ file: productURL(product), view: "product", name: product.name,
    description: product.description, crumbs, product });
}

export const routes = pages.map((page) => ({
  ...page,
  title: page.title || `${page.name} — ShopProject`,
}));

export function routeFor(pathname) {
  const file = pathname.split("/").at(-1) || "index.html";
  return routes.find((route) => route.file === file) || routes.find((route) => route.file === "404.html");
}
