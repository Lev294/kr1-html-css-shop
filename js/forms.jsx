import { useEffect, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { calculateFinalPrice, formatPrice, productByCode } from "./data.js";

export const staticOnly = import.meta.env.VITE_STATIC_ONLY === "1";

export function RequestForm({ products, prefix, order = false }) {
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(!staticOnly);
  const pending = useRef(false);
  const form = useRef(null);
  const id = (name) => `${prefix}-${name}`;
  const product = products?.find((item) => item.code === selected);
  const notesField = order ? "comment" : "message";
  const submitLabel = `${staticOnly ? "Подготовить" : "Отправить"} ${order ? "заявку" : "сообщение"}`;

  useEffect(() => {
    if (staticOnly) setReady(true);
    if (!order) return;
    const code = new URLSearchParams(window.location.search).get("product");
    const requested = productByCode(code);
    if (requested?.inStock) setSelected(requested.code);
  }, [order]);

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
      if (order && !product?.inStock) {
        setResult({ status: "error", field: "product", text: "Выберите товар в наличии." });
        return;
      }
      if (order && !/^[78]\d{10}$/.test(body.phone.replace(/[\s()+-]/g, ""))) {
        setResult({ status: "error", field: "phone", text: "Введите телефон из 11 цифр, начиная с +7 или 8." });
        return;
      }
      const contactLines = [`Имя: ${body.name}`, `Почта: ${body.email}`];
      const lines = order
        ? ["Заявка ShopProject", `Товар: ${product.name}`, `Стоимость: ${formatPrice(calculateFinalPrice(product))}`,
            ...contactLines, `Телефон: ${body.phone}`, `Комментарий: ${body.comment}`]
        : ["Сообщение для ShopProject", ...contactLines, "", body.message];
      setResult({ status: "info", text: order ? "Заявка готова." : "Сообщение готово.",
        file: `data:text/plain;charset=utf-8,${encodeURIComponent(lines.join("\n"))}` });
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
      if (order) setSelected("");
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
    action={order ? "/api/orders" : "/api/messages"} onSubmit={submit}
    onChange={() => { if (result) setResult(null); }}>
    {order && <div className="field">
      <label htmlFor={id("product")}>Товар</label>
      <select id={id("product")} name="product" value={selected}
        onChange={(event) => setSelected(event.target.value)} required {...fieldError("product")}>
        <option value="">Выберите товар</option>
        {products.map((item) => <option key={item.code} value={item.code} disabled={!item.inStock}>
          {item.name} · {formatPrice(calculateFinalPrice(item))}
        </option>)}
      </select>
      {product && <div className="form-selected">
        <img src={product.image} alt="" width="96" height="72" />
        <span><strong>{product.name}</strong><span>{formatPrice(calculateFinalPrice(product))}</span></span>
      </div>}
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
        aria-describedby={id("phone-hint")} required {...fieldError("phone")} />
      <p className="field__hint" id={id("phone-hint")}>11 цифр, начиная с +7 или 8.</p>
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
    <Button className="request-form__submit" variant="primary" size="lg" type="submit"
      isDisabled={sending || !ready} label={sending ? "Отправляем…" : submitLabel} />
    {result?.status === "error"
      ? <p className="notice notice--error" id={id("error")} role="alert">{result.text}</p>
      : <p className={result?.status === "success" ? "notice notice--success" : result ? "notice" : "sr-only"} role="status">{result?.text}</p>}
    {result?.file && <a className="form-download" href={result.file} download={order ? "shopproject-order.txt" : "shopproject-message.txt"}>
      {order ? "Скачать заявку" : "Скачать сообщение"}
    </a>}
    <noscript><p className="notice">Для работы формы включите JavaScript.</p></noscript>
  </form>;
}
