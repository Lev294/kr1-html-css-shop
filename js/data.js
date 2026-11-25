import products from "../data/products.json";

export { products };

export const categories = [
  { id: "keyboards", name: "Клавиатуры", description: "От компактных до полноразмерных", image: "images/category-keyboards.webp" },
  { id: "mice", name: "Мыши", description: "Проводные и беспроводные", image: "images/category-mice.webp" },
  { id: "accessories", name: "Аксессуары", description: "Хабы, коврики и микрофоны", image: "images/hub-h6.webp" },
];

export function categoryURL(id) {
  return `catalog.html?category=${id}#products`;
}

const rubles = new Intl.NumberFormat("ru-RU", {
  style: "currency", currency: "RUB", maximumFractionDigits: 0,
});

export function formatPrice(price) {
  return rubles.format(price);
}

export function calculateDiscount(product) {
  return Math.round(product.price * product.discountPercent / 100);
}

export function calculateFinalPrice(product) {
  return product.price - calculateDiscount(product);
}

export function getProductStatus(product) {
  return product.inStock && product.price > 0 ? "В наличии" : "Нет в наличии";
}

export function createProductSummary(product) {
  return `${product.name} · ${formatPrice(calculateFinalPrice(product))} · ${getProductStatus(product)}`;
}

export function productURL(product) {
  return product.code === "K-87" ? "product.html" : `product-${product.code.toLowerCase()}.html`;
}

export function orderURL(product) {
  return `order.html?product=${encodeURIComponent(product.code)}`;
}

export function productByCode(code) {
  return products.find((product) => product.code === code || product.name === code);
}
