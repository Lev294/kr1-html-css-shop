import { useEffect, useRef, useState } from "react";
import {
  calculateDiscount, calculateFinalPrice, categories, createProductSummary,
  formatPrice, getProductStatus, orderURL, productURL,
} from "./data.js";
import { ContactLinks, Icon } from "./layout.jsx";
import { QuickOrder, RequestForm } from "./forms.jsx";

function PageIntro({ title, children }) {
  return <div className="page-intro">
    <h1>{title}</h1>
    {children && <p>{children}</p>}
  </div>;
}

function Price({ product }) {
  return <p className="price">
    <strong>{formatPrice(calculateFinalPrice(product))}</strong>
    {calculateDiscount(product) > 0 && <del>{formatPrice(product.price)}</del>}
  </p>;
}

function ProductImage({ product, eager = false }) {
  return <img className="product-image" src={product.image} alt={product.alt} width="640" height="400"
    loading={eager ? undefined : "lazy"} fetchPriority={eager ? "high" : undefined} decoding="async" />;
}

function ProductCard({ product, onQuickOrder, compact = false }) {
  const category = categories.find((item) => item.id === product.category);
  const variant = product.variant ? ` product-card--${product.variant}` : "";
  return <article className={`product-card${variant}${compact ? " product-card--compact" : ""}`}>
    <ProductImage product={product} />
    <div className="product-card__body">
      <p className="product-card__category">{category.name}</p>
      <h3>{product.name}</h3>
      <p className="product-card__description">{product.description}</p>
      <ul className="product-card__specs">{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
      <div className="product-card__actions">
        <Price product={product} />
        <div className="actions">
          <a className="button button--secondary" href={productURL(product)}
            aria-label={`Подробнее о товаре «${product.name}»`}>Подробнее</a>
          {onQuickOrder && product.inStock && <button className="button button--primary" type="button"
            aria-label={`Заказать «${product.name}»`} onClick={() => onQuickOrder(product.code)}>Заказать</button>}
        </div>
      </div>
    </div>
  </article>;
}

function categoryURL(category) {
  return category.id === "keyboards" ? "keyboards.html" : `catalog.html#${category.id}`;
}

export function HomePage({ products }) {
  const dialog = useRef(null);
  const [selected, setSelected] = useState("");
  const featured = products.filter((product) => ["K-87", "M-12", "H-6"].includes(product.code));

  function openOrder(code) {
    setSelected(code);
    dialog.current.showModal();
  }

  return <>
    <section className="hero" aria-labelledby="home-title">
      <div className="hero__copy">
        <h1 id="home-title">Компьютерные аксессуары</h1>
        <p>Клавиатуры, мыши и полезные мелочи для работы, учёбы и игр.</p>
        <a className="button button--hero" href="catalog.html">Смотреть каталог <Icon name="arrow" size={18} /></a>
      </div>
      <picture className="hero__media">
        <source media="(min-width: 760px)" srcSet="images/desk-640.webp 640w, images/desk-1280.webp 1280w"
          sizes="(min-width: 1300px) 700px, 54vw" />
        <img src="images/desk-640.webp" srcSet="images/desk-640.webp 640w, images/desk-1280.webp 1280w"
          sizes="100vw" alt="Графитовая клавиатура и беспроводная мышь на настольном коврике"
          width="1280" height="853" fetchPriority="high" />
      </picture>
    </section>
    <section className="section" id="advantages" aria-labelledby="categories-title">
      <div className="section-heading"><h2 id="categories-title">Категории</h2></div>
      <ul className="category-grid">
        {categories.map((category) => <li key={category.id}>
          <a className="category-link" href={categoryURL(category)}>
            <span className="category-link__icon"><Icon name={category.id} size={24} /></span>
            <span className="category-link__label"><strong>{category.name}</strong><span>{category.description}</span></span>
            <Icon name="arrow" size={18} />
          </a>
        </li>)}
      </ul>
    </section>
    <section className="section" id="popular" aria-labelledby="popular-title">
      <div className="section-heading">
        <h2 id="popular-title">Популярные товары</h2>
        <a className="text-link" href="catalog.html">Весь каталог <Icon name="arrow" size={17} /></a>
      </div>
      <div className="products-grid">
        {featured.map((product) => <ProductCard key={product.code} product={product} onQuickOrder={openOrder} />)}
      </div>
    </section>
    <section className="section advice" aria-labelledby="advice-title">
      <h2 id="advice-title">Соберите удобное рабочее место</h2>
      <div className="advice__grid">
        <div><h3>Оставьте место для мыши</h3><p>Если цифровой блок нужен редко, компактная клавиатура даст больше свободы на небольшом столе.</p></div>
        <div><h3>Проверьте разъёмы</h3><p>Уточните, какие порты есть на компьютере. Для USB-периферии и внешнего экрана может пригодиться хаб.</p></div>
        <div><h3>Подберите форму мыши</h3><p>Для долгой работы важны размер, хват и расположение кнопок. Сравните обычные и эргономичные модели.</p></div>
      </div>
    </section>
    <QuickOrder products={products} dialog={dialog} selected={selected} />
  </>;
}

export function CatalogPage({ route, products }) {
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase().replace(/ё/g, "е");
  const groups = categories.filter((category) => !route.category || route.category === category.id)
    .map((category) => ({
      ...category,
      products: products.filter((product) => product.category === category.id &&
        `${product.name} ${product.description} ${product.specs.join(" ")}`.toLowerCase().replace(/ё/g, "е").includes(search)),
    }));
  const count = groups.reduce((total, group) => total + group.products.length, 0);

  return <>
    <PageIntro title={route.category ? "Клавиатуры" : "Каталог аксессуаров"}>
      {route.category
        ? "Сравните компактные и полноразмерные модели по формату, раскладке и подключению."
        : "Выберите категорию или найдите конкретную модель по названию."}
    </PageIntro>
    <div className="catalog-layout">
      <aside className="catalog-filters">
        <nav aria-label="Категории каталога">
          <h2>Категории</h2>
          <ul>
            <li><a href={route.category ? "catalog.html" : "#products"}>Все товары</a></li>
            {categories.map((category) => <li key={category.id}>
              <a href={route.category ? categoryURL(category) : `#${category.id}`}
                aria-current={route.category === category.id ? "page" : undefined}>{category.name}</a>
            </li>)}
          </ul>
        </nav>
      </aside>
      <div className="catalog-layout__products" id="products">
        <div className="catalog-search">
          <label htmlFor="catalog-search">Поиск по каталогу</label>
          <div className="catalog-search__input"><Icon name="search" />
            <input type="search" id="catalog-search" value={query} maxLength={100} placeholder="Например, K-87"
              onChange={(event) => setQuery(event.target.value)} />
          </div>
          <p className="catalog-search__count" role="status">Найдено товаров: {count}</p>
        </div>
        {count === 0 && <p className="notice">Товары не найдены. Попробуйте другое название.</p>}
        {groups.map((group) => group.products.length > 0 && <section className="catalog-group" id={group.id} key={group.id}>
          <div className="section-heading"><h2>{group.name}</h2></div>
          <div className={route.category ? "products-grid products-grid--compact" : "products-grid"}>
            {group.products.map((product) => <ProductCard key={product.code} product={product} compact={Boolean(route.category)} />)}
          </div>
        </section>)}
      </div>
    </div>
  </>;
}

export function ProductPage({ product }) {
  const summary = useRef(null);
  const category = categories.find((item) => item.id === product.category);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("practice") !== "15") return;
    summary.current.textContent = createProductSummary(product);
    summary.current.hidden = false;
    console.table({
      "Цена": formatPrice(product.price),
      "Скидка": formatPrice(calculateDiscount(product)),
      "Итого": formatPrice(calculateFinalPrice(product)),
      "Статус": getProductStatus(product),
      "Описание": createProductSummary(product),
    });
  }, [product]);

  return <>
    <div className="product-detail">
      <div className="product-detail__gallery">
        <ProductImage product={product} eager />
        {product.code === "K-87" && <figure>
          <img className="product-image" src="images/keyboard-k87-side.svg"
            alt="Боковой профиль K-87: наклон корпуса и разъём USB-C" width="640" height="400" loading="lazy" decoding="async" />
          <figcaption>Боковой вид и разъём подключения</figcaption>
        </figure>}
      </div>
      <div className="product-detail__info">
        <a className="text-link" href={categoryURL(category)}>{category.name}</a>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <ul>{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
        <div className="product-detail__purchase">
          <p className="stock">{getProductStatus(product)}</p>
          <Price product={product} />
          {product.inStock && <a className="button button--primary" href={orderURL(product)}>Оформить заявку <Icon name="arrow" size={18} /></a>}
        </div>
        <p className="notice" ref={summary} hidden />
      </div>
    </div>
    <section className="section" aria-labelledby="specs-title">
      <div className="section-heading"><h2 id="specs-title">Характеристики</h2></div>
      <div className="table-scroll">
        <table className="specs-table">
          <caption className="sr-only">Технические характеристики модели {product.code}</caption>
          <tbody>{product.details.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
    {product.package && <section className="section panel" aria-labelledby="package-title">
      <h2 id="package-title">Комплект поставки</h2>
      <ul>{product.package.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>}
  </>;
}

export function OrderPage({ products }) {
  return <>
    <PageIntro title="Оформить заявку">Выберите модель и оставьте контакты для связи.</PageIntro>
    <div className="form-layout">
      <section className="panel" aria-labelledby="order-form-title">
        <h2 id="order-form-title">Данные заявки</h2>
        <RequestForm products={products} prefix="order" order />
      </section>
      <aside className="panel panel--muted">
        <h2>Нужна помощь с выбором?</h2>
        <p>На странице товара есть характеристики и описание подключения. Если остались вопросы, напишите через форму обратной связи.</p>
        <a className="text-link" href="contacts.html#feedback">Обратная связь <Icon name="arrow" size={17} /></a>
      </aside>
    </div>
  </>;
}

export function ContactsPage() {
  return <>
    <PageIntro title="Контакты">Задайте вопрос о товаре или заявке через форму обратной связи.</PageIntro>
    <div className="form-layout">
      <section className="panel" id="feedback" aria-labelledby="feedback-title">
        <h2 id="feedback-title">Обратная связь</h2>
        <RequestForm prefix="feedback" />
      </section>
      <aside className="panel panel--muted">
        <h2>Телефон и почта</h2>
        <ContactLinks />
        <p>Контактные данные приведены для демонстрации магазина.</p>
      </aside>
    </div>
  </>;
}

export function AboutPage() {
  return <>
    <PageIntro title="О магазине">ShopProject — каталог компьютерных аксессуаров для учёбы, работы и игр.</PageIntro>
    <section className="panel panel--about" aria-labelledby="about-title">
      <img src="images/desk-640.webp" srcSet="images/desk-640.webp 640w, images/desk-1280.webp 1280w"
        sizes="(min-width: 760px) 42vw, 100vw" alt="Клавиатура и мышь на рабочем столе" width="640" height="427" />
      <div>
        <h2 id="about-title">Что есть в ShopProject</h2>
        <p>В каталоге девять товаров: компактные и полноразмерные клавиатуры, проводные и беспроводные мыши, USB-C хаб, коврик и настольный микрофон.</p>
        <p>У каждого товара указаны цена, основные параметры и подходящие сценарии использования. Это помогает подобрать модель под свой компьютер и рабочее место.</p>
        <a className="button button--primary" href="catalog.html">Открыть каталог <Icon name="arrow" size={18} /></a>
      </div>
    </section>
  </>;
}

export function MissingPage() {
  return <>
    <PageIntro title="Страница не найдена">Возможно, адрес изменился. Попробуйте найти нужный товар в каталоге.</PageIntro>
    <a className="button button--primary" href="catalog.html">Вернуться в каталог</a>
  </>;
}
