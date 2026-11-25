import { useEffect, useRef, useState } from "react";
import { navigation } from "./routes.js";

const icons = {
  brand: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 9h8M8 15h4" /></>,
  keyboards: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h8" /></>,
  mice: <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M12 6v4" /></>,
  accessories: <><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v8l9 5 9-5V8M12 13v8" /></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m3 6 9 7 9-7" /></>,
  phone: <path d="m5 3 4 1 1 5-2 2a15 15 0 0 0 5 5l2-2 5 1 1 4c0 2-2 2-3 2C10 20 4 14 3 6c0-1 0-3 2-3Z" />,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4" /></>,
};

export function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">{icons[name]}</svg>;
}

function Brand() {
  return <a className="brand" href="index.html"><span className="brand__mark"><Icon name="brand" size={23} /></span><span>ShopProject</span></a>;
}

function Navigation({ route, onClick }) {
  return <ul className="site-nav__list">{navigation.map(([href, label]) => (
    <li key={href}><a className="site-nav__link" href={href}
      aria-current={route.file === href ? "page" : undefined} onClick={onClick}>{label}</a></li>
  ))}</ul>;
}

export function Header({ route }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);

  function closeOnEscape(event) {
    if (event.key === "Escape" && menuOpen) {
      setMenuOpen(false);
      menuButton.current.focus();
    }
  }

  return <>
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <div id="top" />
    <header className="site-header" onKeyDown={closeOnEscape}>
      <div className="container site-header__inner">
        <Brand />
        <button ref={menuButton} className="menu-toggle button button--secondary" type="button"
          aria-controls="main-nav" aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? "close" : "menu"} /> Меню
        </button>
        <nav className="site-nav" id="main-nav" aria-label="Основная навигация" data-open={menuOpen}>
          <Navigation route={route} onClick={() => setMenuOpen(false)} />
        </nav>
      </div>
    </header>
  </>;
}

export function Breadcrumbs({ route }) {
  if (!route.crumbs) return null;
  return <nav className="breadcrumbs" aria-label="Хлебные крошки">
    <ol>
      {route.crumbs.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}
      <li aria-current="page">{route.name}</li>
    </ol>
  </nav>;
}

export function ContactLinks() {
  return <ul className="contact-links">
    <li><Icon name="phone" size={17} /><a href="tel:+79000000000">+7 (900) 000-00-00</a></li>
    <li><Icon name="mail" size={17} /><a href="mailto:info@example.com">info@example.com</a></li>
  </ul>;
}

export function Footer({ route }) {
  return <footer className="site-footer">
    <div className="container site-footer__inner">
      <div>
        <Brand />
        <p>Клавиатуры, мыши и аксессуары<br />для рабочего места.</p>
      </div>
      <nav className="site-footer__nav" aria-label="Навигация в подвале">
        <p className="site-footer__label">Навигация</p>
        <Navigation route={route} />
      </nav>
      <div>
        <p className="site-footer__label">Контакты</p>
        <ContactLinks />
      </div>
    </div>
    <div className="container site-footer__bottom">© 2026 ShopProject</div>
  </footer>;
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > 480);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return <a className="back-to-top button button--secondary" href="#top" hidden={!visible}>Наверх</a>;
}
