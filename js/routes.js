import { categories, products, productURL } from "./data.js";

export const navigation = [
  ["index.html", "Главная"],
  ["catalog.html", "Каталог"],
  ["keyboards.html", "Клавиатуры"],
  ["about.html", "О магазине"],
  ["contacts.html", "Контакты"],
  ["order.html", "Заявка"],
];

const homeCrumb = ["index.html", "Главная"];
const catalogCrumb = ["catalog.html", "Каталог"];
const pages = [
  { file: "index.html", view: "home", name: "Компьютерные аксессуары",
    title: "ShopProject — компьютерные аксессуары",
    description: "Клавиатуры, мыши и аксессуары для рабочего стола. Сравните модели и характеристики в каталоге ShopProject." },
  { file: "catalog.html", view: "catalog", name: "Каталог",
    description: "Девять компьютерных аксессуаров ShopProject: механические и мембранные клавиатуры, мыши, USB-C хаб, коврик и микрофон.",
    crumbs: [homeCrumb] },
  { file: "keyboards.html", view: "catalog", category: "keyboards", name: "Клавиатуры",
    description: "Клавиатуры K-87, K-104 и K-68. Сравните формат, тип клавиш, раскладку и подключение.",
    crumbs: [homeCrumb, catalogCrumb] },
  { file: "about.html", view: "about", name: "О магазине",
    description: "О ShopProject и о том, как выбрать аксессуары под своё рабочее место.",
    crumbs: [homeCrumb] },
  { file: "contacts.html", view: "contacts", name: "Контакты",
    description: "Контакты ShopProject и форма обратной связи. Задайте вопрос о товаре или заявке.",
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
  const crumbs = [homeCrumb, catalogCrumb];
  if (category.id === "keyboards") crumbs.push(["keyboards.html", category.name]);
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
