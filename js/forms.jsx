import { useEffect, useRef, useState } from "react";
import { calculateFinalPrice, formatPrice, productByCode } from "./data.js";
import { Icon } from "./layout.jsx";

export const staticOnly = import.meta.env.VITE_STATIC_ONLY === "1";

export function RequestForm({ products, prefix, productCode = "", order = false, callback = false }) {
  const [selected, setSelected] = useState(productCode);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  const form = useRef(null);
  const id = (name) => `${prefix}-${name}`;
  const product = products?.find((item) => item.code === selected);
  const notesField = order ? "comment" : "message";

  useEffect(() => {
    if (prefix !== "order") return;
    const code = new URLSearchParams(window.location.search).get("product");
    setSelected(productByCode(code)?.code || "");
  }, [prefix]);

  useEffect(() => {
    if (result?.field) form.current.elements.namedItem(result.field)?.focus();
  }, [result]);

  function fieldError(name) {
    return result?.field === name ? { "aria-invalid": true, "aria-describedby": id("error") } : {};
  }

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const fields = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields);
    body.consent = fields.has("consent");

    if (staticOnly) {
      setResult({ status: "info", text: "Форма заполнена. В демоверсии данные не отправляются." });
      return;
    }
    pending.current = true;
    setSending(true);
    setResult(null);
    try {
      const response = await fetch(order ? "/api/orders" : "/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.headers.get("Content-Type")?.includes("application/json")) {
        throw new Error("JSON response expected");
      }
      const data = await response.json();
      if (!response.ok) {
        setResult({ status: "error", field: data.field, text: data.error });
        return;
      }
      form.current.reset();
      if (order) setSelected(productCode);
      setResult({ status: "success", text: order
        ? `Заявка ${data.id} принята. Стоимость товара: ${formatPrice(data.total)}.`
        : `Сообщение ${data.id} принято.` });
    } catch {
      setResult({ status: "error", text: "Не удалось отправить форму. Попробуйте ещё раз чуть позже." });
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return <form className="request-form" ref={form} method="post"
    action={order ? "/api/orders" : "/api/messages"} onSubmit={submit}>
    {staticOnly && <p className="notice">Здесь можно проверить форму на демонстрационных данных.</p>}
    {order && <div className="field">
      <label htmlFor={id("product")}>Товар</label>
      <select id={id("product")} name="product" value={selected}
        onChange={(event) => setSelected(event.target.value)} required {...fieldError("product")}>
        <option value="">Выберите товар</option>
        {products.map((item) => <option key={item.code} value={item.code} disabled={!item.inStock}>
          {item.name} · {formatPrice(calculateFinalPrice(item))}
        </option>)}
      </select>
      {product && <p className="field__hint">Стоимость товара: {formatPrice(calculateFinalPrice(product))}</p>}
    </div>}
    <div className="form-grid">
      <div className="field">
        <label htmlFor={id("name")}>Имя</label>
        <input id={id("name")} name="name" autoComplete="given-name" minLength={2} maxLength={80}
          required {...fieldError("name")} />
      </div>
      <div className="field">
        <label htmlFor={id("email")}>Электронная почта</label>
        <input id={id("email")} name="email" type="email" autoComplete="email" maxLength={254}
          required {...fieldError("email")} />
      </div>
    </div>
    {order && <div className="field">
      <label htmlFor={id("phone")}>Телефон</label>
      <input id={id("phone")} name="phone" type="tel" autoComplete="tel" minLength={11} maxLength={24}
        placeholder="+7 (900) 000-00-00" aria-describedby={id("phone-hint")} required {...fieldError("phone")} />
      <p className="field__hint" id={id("phone-hint")}>11 цифр, начиная с +7 или 8.</p>
    </div>}
    {callback && <div className="form-grid">
      <div className="field">
        <label htmlFor={id("date")}>Дата связи (необязательно)</label>
        <input id={id("date")} name="date" type="date" {...fieldError("date")} />
      </div>
      <div className="field">
        <label htmlFor={id("topic")}>Тема заявки</label>
        <select id={id("topic")} name="topic" {...fieldError("topic")}>
          <option value="order">Заказ товара</option>
          <option value="question">Вопрос о товаре</option>
        </select>
      </div>
    </div>}
    <div className="field">
      <label htmlFor={id(notesField)}>{order ? "Комментарий (необязательно)" : "Сообщение"}</label>
      <textarea id={id(notesField)} name={notesField} rows={4}
        maxLength={1000} minLength={order ? undefined : 10} required={!order} {...fieldError(notesField)} />
    </div>
    <label className="form-consent" htmlFor={id("consent")}>
      <input type="checkbox" id={id("consent")} name="consent" required {...fieldError("consent")} />
      <span>Я согласен на обработку указанных данных для ответа на обращение.</span>
    </label>
    <button className="button button--primary" type="submit" disabled={sending}>
      {sending ? "Отправляем…" : order ? "Отправить заявку" : "Отправить сообщение"}
    </button>
    {result?.status === "error"
      ? <p className="notice notice--error" id={id("error")} role="alert">{result.text}</p>
      : <p className={result?.status === "success" ? "notice notice--success" : result ? "notice" : "sr-only"} role="status">{result?.text}</p>}
    <noscript><p className="notice">Для отправки формы включите JavaScript.</p></noscript>
  </form>;
}

export function QuickOrder({ products, dialog, selected }) {
  return <dialog className="order-dialog" ref={dialog} aria-labelledby="quick-order-title">
    <div className="order-dialog__header">
      <h2 id="quick-order-title">Оформить заявку</h2>
      <button className="button button--secondary icon-button" type="button" aria-label="Закрыть заявку"
        onClick={() => dialog.current.close()}><Icon name="close" /></button>
    </div>
    <RequestForm key={selected} products={products} prefix="quick" productCode={selected} order callback />
  </dialog>;
}
