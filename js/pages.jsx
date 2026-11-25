import { useEffect, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Tab, TabList } from "@astryxdesign/core/TabList";
import { TextInput } from "@astryxdesign/core/TextInput";
import {
  calculateDiscount, calculateFinalPrice, categories, categoryURL, createProductSummary,
  formatPrice, getProductStatus, orderURL, productURL,
} from "./data.js";
import { buyingTips, orderFAQ, orderSteps, productTips, setups, storeFAQ } from "./content.js";
import { ContactLinks, Icon } from "./layout.jsx";
import { QuickOrder, RequestForm } from "./forms.jsx";

function PageIntro({ title, children }) {
  return <div className="page-intro">
    <h1>{title}</h1>
    <p>{children}</p>
  </div>;
}

function SectionHeading({ id, title, children }) {
  return <div className="section-heading"><h2 id={id}>{title}</h2>{children}</div>;
}

function DeskPhoto() {
  return <picture className="desk-photo">
    <source media="(min-width: 760px)" srcSet="images/desk-640.webp 640w, images/desk-1280.webp 1280w"
      sizes="(min-width: 1280px) 540px, 47vw" />
    <img src="images/desk-640.webp" srcSet="images/desk-640.webp 640w, images/desk-1280.webp 1280w"
      sizes="100vw" alt="Клавиатура и мышь на рабочем столе"
      width="1280" height="854" fetchPriority="high" />
  </picture>;
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

function ProductCard({ product, onQuickOrder }) {
  const category = categories.find((item) => item.id === product.category);
  const variant = product.variant === "featured" ? "yellow" : product.variant === "dark" ? "muted" : "default";
  return <article className="product-card">
    <Card padding={0} variant={variant} className="product-card__frame">
      <ProductImage product={product} />
      <div className="product-card__body">
        <p className="product-card__category">{category.name}</p>
        <h3>{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
        <ul className="product-card__specs">{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
        <div className="product-card__actions">
          <Price product={product} />
          <div className="actions">
            <Button variant="secondary" href={productURL(product)}
              label={`Подробнее о товаре «${product.name}»`}>Подробнее</Button>
            {product.inStock && (onQuickOrder
              ? <Button variant="primary" label={`Заказать «${product.name}»`}
                  onClick={() => onQuickOrder(product.code)}>Заказать</Button>
              : <Button variant="primary" href={orderURL(product)}
                  label={`Заказать «${product.name}»`}>Заказать</Button>)}
          </div>
        </div>
      </div>
    </Card>
  </article>;
}

function ProductGrid({ products, onQuickOrder, related = false }) {
  return <div className={related ? "products-grid products-grid--related" : "products-grid"}>
    {products.map((product) => <ProductCard key={product.code} product={product} onQuickOrder={onQuickOrder} />)}
  </div>;
}

function InfoCards({ items }) {
  return <div className="info-grid">
    {items.map(({ title, text }) => <Card key={title} className="info-card">
      <h3>{title}</h3><p>{text}</p>
    </Card>)}
  </div>;
}

function FAQ({ items }) {
  return <section className="section" aria-labelledby="faq-title">
    <SectionHeading id="faq-title" title="Частые вопросы" />
    <div className="faq">
      {items.map(([question, answer], index) => <details key={question} open={index === 0}>
        <summary>{question}</summary>
        <p>{answer}</p>
      </details>)}
    </div>
  </section>;
}

function SectionTabs({ id, label, items, active, onChange, children }) {
  return <>
    <TabList value={active} onChange={onChange} role="tablist" aria-label={label} size="lg" hasDivider>
      {items.map((item) => <Tab key={item.id} id={`${id}-tab-${item.id}`}
        value={item.id} label={item.label} panelId={`${id}-panel-${item.id}`} />)}
    </TabList>
    {items.map((item) => <div key={item.id} id={`${id}-panel-${item.id}`} role="tabpanel"
      aria-labelledby={`${id}-tab-${item.id}`} hidden={active !== item.id} tabIndex={0} className="tab-panel">
      {active === item.id ? children : null}
    </div>)}
  </>;
}

function SetupGuide({ products }) {
  const [active, setActive] = useState(setups[0].id);
  const setup = setups.find((item) => item.id === active);
  const example = products.find((item) => item.code === setup.product);

  return <section className="section" id="guide" aria-labelledby="guide-title">
    <SectionHeading id="guide-title" title="Как выбрать комплект" />
    <Card variant="muted" padding={0} className="guide-panel">
      <SectionTabs id="setup" items={setups} active={active} onChange={setActive} label="Для каких задач нужны аксессуары">
        <div className="guide-panel__body">
          <div>
            <h3>{setup.title}</h3>
            <p>{setup.text}</p>
          </div>
          {example && <div className="guide-panel__example">
            <ProductImage product={example} />
            <div>
              <span>Подходящая модель</span>
              <strong>{example.name}</strong>
              <Button variant="secondary" label="Посмотреть модель" href={productURL(example)} />
            </div>
          </div>}
        </div>
      </SectionTabs>
    </Card>
  </section>;
}

function OrderSteps() {
  return <section className="section" aria-labelledby="steps-title">
    <SectionHeading id="steps-title" title="Как проходит заявка">
      <Button variant="secondary" href="order.html" label="Открыть заявку" />
    </SectionHeading>
    <ol className="steps">
      {orderSteps.map(({ title, text }) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}
    </ol>
  </section>;
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
    <section className="hero hero--home" aria-labelledby="home-title">
      <div className="hero__copy">
        <h1 id="home-title">Всё для <span>рабочего стола</span></h1>
        <p>Подберите клавиатуру, мышь и аксессуары под свой стол. Сравните размеры, подключение и комплектацию перед выбором.</p>
        <div className="actions">
          <Button label="Смотреть каталог" href="catalog.html" size="lg" variant="primary" endContent={<Icon name="arrow" size={18} />} />
          <Button label="Как выбрать" href="#guide" size="lg" variant="secondary" />
        </div>
      </div>
      <DeskPhoto />
    </section>

    <section className="section section--categories" id="advantages" aria-labelledby="categories-title">
      <SectionHeading id="categories-title" title="Категории" />
      <ul className="category-grid">
        {categories.map((category) => <li key={category.id}>
          <a className="category-link" href={categoryURL(category.id)}>
            <img className="category-link__photo" src={category.image} alt="" width="640" height="400" loading="lazy" decoding="async" />
            <span className="category-link__caption">
              <span className="category-link__label"><strong>{category.name}</strong><span>{category.description}</span></span>
              <span className="category-link__arrow"><Icon name="arrow" size={19} /></span>
            </span>
          </a>
        </li>)}
      </ul>
    </section>

    <section className="section" id="popular" aria-labelledby="popular-title">
      <SectionHeading id="popular-title" title="Популярные товары">
        <Button variant="secondary" href="catalog.html" label="Весь каталог" endContent={<Icon name="arrow" size={17} />} />
      </SectionHeading>
      <ProductGrid products={featured} onQuickOrder={openOrder} />
    </section>

    <SetupGuide products={products} />
    <section className="section buying-guide" aria-labelledby="buying-title">
      <SectionHeading id="buying-title" title="Что проверить перед покупкой" />
      <InfoCards items={buyingTips} />
    </section>
    <OrderSteps />
    <FAQ items={storeFAQ} />
    <QuickOrder products={products} dialog={dialog} selected={selected} />
  </>;
}

const catalogTabs = [
  { id: "all", label: "Все товары" },
  ...categories.map(({ id, name }) => ({ id, label: name })),
];

function normalize(text) {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

export function CatalogPage({ products }) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("category");
    if (catalogTabs.some(({ id }) => id === selected)) setActive(selected);
  }, []);

  const search = normalize(query);
  const groups = categories.filter(({ id }) => active === "all" || active === id).map((category) => ({
    ...category,
    products: products.filter((product) => product.category === category.id &&
      normalize(`${product.name} ${product.description} ${product.specs.join(" ")}`).includes(search)),
  }));
  const count = groups.reduce((total, group) => total + group.products.length, 0);

  return <>
    <PageIntro title="Каталог аксессуаров">Выберите категорию или найдите модель по названию. В карточках собраны цена, описание и основные характеристики.</PageIntro>
    <section id="products" aria-label="Поиск и категории товаров">
      <Card padding={0} className="catalog-controls">
        <div className="catalog-search" role="search" aria-label="Поиск по каталогу">
          <TextInput id="catalog-search" label="Поиск по каталогу" type="search" value={query}
            onChange={setQuery} startIcon={<Icon name="search" />} placeholder="Например, K-87"
            maxLength={100} width="100%" size="lg" hasClear />
        </div>
        <SectionTabs id="category" label="Категории каталога" items={catalogTabs} active={active} onChange={setActive}>
          <p className="catalog-search__count" role="status">Найдено товаров: {count}</p>
          {count === 0 && <div className="empty-results">
            <p>По этому запросу товаров нет. Попробуйте код модели или сократите запрос.</p>
            <Button label="Очистить поиск" onClick={() => setQuery("")} />
          </div>}
          {groups.map((group) => group.products.length > 0 &&
            <section className="catalog-group" id={group.id} key={group.id}>
              <div className="section-heading"><h2>{group.name}</h2><p>{group.description}</p></div>
              <ProductGrid products={group.products} />
            </section>)}
        </SectionTabs>
      </Card>
    </section>
    <section className="section" aria-labelledby="catalog-tips-title">
      <SectionHeading id="catalog-tips-title" title="На что смотреть в карточке" />
      <InfoCards items={buyingTips} />
    </section>
    <FAQ items={storeFAQ} />
  </>;
}

export function ProductPage({ product, products }) {
  const summary = useRef(null);
  const category = categories.find((item) => item.id === product.category);
  const related = products.filter((item) => item.category === product.category && item.code !== product.code);

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
            alt="Схема корпуса клавиатуры в профиль и разъёма USB-C" width="640" height="400" loading="lazy" decoding="async" />
          <figcaption>Схема корпуса и разъёма подключения</figcaption>
        </figure>}
      </div>
      <Card className="product-detail__info" padding={6}>
        <a className="text-link" href={categoryURL(category.id)}>{category.name}</a>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <ul>{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
        <div className="product-detail__purchase">
          <p className="stock">{getProductStatus(product)}</p>
          <Price product={product} />
          {product.inStock && <Button variant="primary" size="lg" href={orderURL(product)} label="Оформить заявку"
            endContent={<Icon name="arrow" size={18} />} />}
        </div>
        <p className="notice" ref={summary} hidden />
      </Card>
    </div>
    <section className="section" aria-labelledby="specs-title">
      <SectionHeading id="specs-title" title="Характеристики" />
      <div className="table-scroll">
        <table className="specs-table">
          <caption className="sr-only">Технические характеристики модели {product.code}</caption>
          <tbody>{product.details.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="section detail-notes" aria-labelledby="use-title">
      <Card variant="muted" padding={6}>
        <h2 id="use-title">Подойдёт ли вам эта модель?</h2>
        <p>{productTips[product.code]}</p>
        <Button variant="secondary" href="about.html#feedback" label="Задать вопрос о товаре" />
      </Card>
      {product.package && <Card padding={6}>
        <h2>Комплект поставки</h2>
        <ul>{product.package.map((item) => <li key={item}>{item}</li>)}</ul>
      </Card>}
    </section>
    {related.length > 0 && <section className="section" aria-labelledby="related-title">
      <SectionHeading id="related-title" title="Другие товары в категории">
        <Button variant="secondary" href={categoryURL(category.id)} label="Вся категория" />
      </SectionHeading>
      <ProductGrid products={related} related />
    </section>}
    <FAQ items={[storeFAQ[0], storeFAQ[2], orderFAQ[0]]} />
  </>;
}

export function OrderPage({ products }) {
  return <>
    <PageIntro title="Оформить заявку">Выберите модель и оставьте контакты. По заявке можно уточнить характеристики товара и способ связи.</PageIntro>
    <div className="form-layout">
      <section aria-labelledby="order-form-title">
        <Card padding={6} className="form-panel">
          <h2 id="order-form-title">Данные заявки</h2>
          <RequestForm products={products} prefix="order" order />
        </Card>
      </section>
      <aside>
        <Card variant="muted" padding={6} className="form-help">
          <h2>Нужна помощь с выбором?</h2>
          <p>Напишите, если сомневаетесь в размере, подключении или комплектации. Код модели из карточки поможет найти нужный товар.</p>
          <ContactLinks />
          <Button variant="secondary" href="about.html#feedback" label="Обратная связь" />
        </Card>
      </aside>
    </div>
    <OrderSteps />
    <section className="section" aria-labelledby="before-order-title">
      <SectionHeading id="before-order-title" title="Перед отправкой" />
      <InfoCards items={[
        { title: "Сверьте модель", text: "У похожих клавиатур может быть разный формат. Сверьте буквенно-цифровой код в заявке с кодом на странице товара." },
        { title: "Укажите удобное время", text: "Если в течение дня вы заняты, напишите в комментарии, в какое время вам удобно обсудить заявку." },
        { title: "Проверьте контакты", text: "Короткая проверка телефона и почты поможет избежать опечатки. Для вопросов о товаре доступна и отдельная форма обратной связи." },
      ]} />
    </section>
    <FAQ items={orderFAQ} />
  </>;
}

export function AboutPage() {
  return <>
    <section className="hero hero--about" aria-labelledby="about-title">
      <div className="hero__copy">
        <h1 id="about-title">О магазине и контакты</h1>
        <p>ShopProject собирает компьютерные аксессуары для учёбы, работы и игр. В каталоге можно сверить размеры, разъёмы и комплект перед выбором.</p>
        <div className="actions">
          <Button href="#contacts" label="Контакты" variant="primary" size="lg" />
          <Button href="catalog.html" label="Открыть каталог" variant="secondary" size="lg" />
        </div>
      </div>
      <DeskPhoto />
    </section>
    <section className="section" aria-labelledby="about-details-title">
      <SectionHeading id="about-details-title" title="Что можно найти в магазине" />
      <InfoCards items={[
        { title: "Клавиатуры", text: "Полноразмерные и компактные модели. Указаны раскладка, количество клавиш и разъём подключения." },
        { title: "Мыши", text: "Проводные и беспроводные, с разными формами корпуса и числом кнопок. В описании есть питание и способ подключения." },
        { title: "Аксессуары", text: "USB-C хаб, настольный коврик и микрофон. Характеристики помогают понять, что войдёт в комплект и сколько места займёт устройство." },
      ]} />
    </section>
    <section className="section" id="contacts" aria-labelledby="contacts-title">
      <SectionHeading id="contacts-title" title="Как с нами связаться" />
      <ContactLinks cards />
    </section>
    <section className="section form-layout" id="feedback" aria-labelledby="feedback-title">
      <div>
        <SectionHeading id="feedback-title" title="Обратная связь" />
        <Card padding={6}><RequestForm prefix="feedback" /></Card>
      </div>
      <aside>
        <Card variant="muted" padding={6} className="form-help">
          <h2>Что указать в сообщении</h2>
          <ul>
            <li>Код товара, если вопрос о конкретной модели.</li>
            <li>Модель компьютера и доступные разъёмы, если нужна помощь с подключением.</li>
            <li>Номер заявки, если она уже отправлена.</li>
          </ul>
          <p>Контактные данные приведены для демонстрации магазина.</p>
        </Card>
      </aside>
    </section>
    <FAQ items={[storeFAQ[2], storeFAQ[3], orderFAQ[2]]} />
  </>;
}

export function MissingPage() {
  return <>
    <PageIntro title="Страница не найдена">Возможно, адрес изменился. Попробуйте найти нужный товар в каталоге.</PageIntro>
    <Button variant="primary" href="catalog.html" label="Вернуться в каталог" />
  </>;
}
