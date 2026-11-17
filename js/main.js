
/* =========================================================
   NJG SOFTWARE — MAIN JAVASCRIPT
   Arquivo: js/main.js
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* 01. ELEMENTOS */

  const header = document.querySelector("#site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector("#nav-links");
  const navItems = document.querySelectorAll(".nav-links a");
  const yearElement = document.querySelector("#current-year");

  const mobileQuery = window.matchMedia(
    "(max-width: 768px)"
  );

  const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /* 02. ANO AUTOMÁTICO */

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* 03. HEADER DINÂMICO */

  function updateHeader() {
    if (!header) return;

    header.classList.toggle(
      "scrolled",
      window.scrollY > 35
    );
  }

  updateHeader();

  window.addEventListener(
    "scroll",
    updateHeader,
    { passive: true }
  );

  /* 04. MENU MOBILE */

  if (menuToggle && navLinks) {

    let isOpen = false;

    const focusableSelector = `
      a[href],
      button:not([disabled]),
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `;

    function getFocusableElements() {
      return Array.from(
        header.querySelectorAll(focusableSelector)
      ).filter(element => {
        return !element.inert;
      });
    }

    function setMenuState(open, restoreFocus = false) {
      isOpen = open && mobileQuery.matches;

      menuToggle.classList.toggle("active", isOpen);
      navLinks.classList.toggle("open", isOpen);

      document.body.classList.toggle("menu-open", isOpen);

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Fechar menu" : "Abrir menu"
      );

      // Bloqueia os links do menu quando estiver oculto.
      navLinks.inert = mobileQuery.matches && !isOpen;

      // Impede interação com o conteúdo de fundo.
      const main = document.querySelector("main");
      const footer = document.querySelector("footer");

      if (main) main.inert = isOpen;
      if (footer) footer.inert = isOpen;

      if (isOpen) {
        navLinks.querySelector("a")?.focus();
      } else if (restoreFocus) {
        menuToggle.focus();
      }
    }

    /* Abrir e fechar */

    menuToggle.addEventListener("click", () => {
      const closing = isOpen;
      setMenuState(!isOpen, closing);
    });

    /* Fechar ao clicar nos links */

    navItems.forEach(link => {

      link.addEventListener("click", () => {
        if (isOpen) {
          setMenuState(false);
        }
      });

    });

    /* Teclado */

    document.addEventListener("keydown", event => {

      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setMenuState(false, true);
        return;
      }

      if (event.key !== "Tab") return;

      const elements = getFocusableElements();

      if (!elements.length) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }

    });

    /* Mudanças de tamanho de tela */

    function handleViewportChange() {
      setMenuState(false);
    }

    mobileQuery.addEventListener(
      "change",
      handleViewportChange
    );

    /* Estado inicial */

    setMenuState(false);

  }

  /* 05. NAVEGAÇÃO POR ÂNCORAS */

  document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", event => {

      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      history.pushState(null, "", targetId);

      target.scrollIntoView({
        behavior: motionQuery.matches ? "instant" : "smooth",
        block: "start"
      });

    });

  });

  /* 06. PÁGINA ATIVA */

  const currentPage =
    window.location.pathname.split("/").pop() ||
    "index.html";

  navItems.forEach(link => {

    const href = link.getAttribute("href");

    if (!href || href.startsWith("#")) return;

    const linkPage = href.split("#")[0];

    const active = linkPage === currentPage;

    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }

    if (!link.classList.contains("nav-cta")) {
      link.classList.toggle("active", active);
    }

  });

  /* 07. CONFIGURAÇÕES GLOBAIS */

  window.NJG = window.NJG || {};

  window.NJG.reducedMotion = () => {
    return motionQuery.matches;
  };

  console.info(
    "%c NJG Software ",
    "background:#8b27ff;color:white;padding:6px 12px;font-weight:bold;border-radius:4px;"
  );

  console.info("Navegação inicializada.");

});
