
/* =========================================================
   NJG SOFTWARE — ANIMATION ENGINE
   Arquivo: js/animations.js
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* 01. CONFIGURAÇÕES GERAIS */

  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const finePointerQuery = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  const isReducedMotion = () => reducedMotionQuery.matches;
  const hasFinePointer = () => finePointerQuery.matches;

  let pageVisible = !document.hidden;

  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
  });

  /* 02. REVEAL ON SCROLL */

  function initScrollReveal() {
    const elements = document.querySelectorAll(".reveal");

    if (!elements.length) return;

    if (
      isReducedMotion() ||
      !("IntersectionObserver" in window)
    ) {
      elements.forEach(el => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting) return;

          entry.target.classList.add("visible");
          observer.unobserve(entry.target);

        });

      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    // Só escondemos elementos após preparar o observer.
    document.documentElement.classList.add("js-motion-ready");

    elements.forEach(el => observer.observe(el));

    reducedMotionQuery.addEventListener("change", () => {
      if (isReducedMotion()) {
        elements.forEach(element => {
          element.classList.add("visible");
        });

        observer.disconnect();
      }
    });

    // Segurança: nunca deixar o conteúdo permanentemente oculto.
    window.addEventListener("pagehide", () => {
      observer.disconnect();
    }, { once: true });
  }

  initScrollReveal();

  /* 03. CURSOR LUMINOSO */

  function initCursorGlow() {
    const glow = document.querySelector(".cursor-glow");

    if (!glow || !hasFinePointer() || isReducedMotion()) {
      return;
    }

    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;

    let active = false;
    let frameId = null;

    function animateCursor() {
      if (!active || isReducedMotion()) {
        frameId = null;
        return;
      }

      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;

      glow.style.left = `${currentX}px`;
      glow.style.top = `${currentY}px`;

      frameId = requestAnimationFrame(animateCursor);
    }

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse") return;

      targetX = event.clientX;
      targetY = event.clientY;

      glow.style.opacity = "1";

      if (!active) {
        active = true;
        frameId = requestAnimationFrame(animateCursor);
      }
    }, { passive: true });

    document.documentElement.addEventListener("pointerleave", () => {
      active = false;
      glow.style.opacity = "0";

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    });

    reducedMotionQuery.addEventListener("change", () => {
      if (isReducedMotion()) {
        active = false;
        glow.style.opacity = "0";

        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }
      }
    });
  }

  initCursorGlow();

  /* 04. CARDS COM EFEITO 3D */

  function initTiltCards() {
    const cards = document.querySelectorAll("[data-tilt]");

    if (!cards.length || !hasFinePointer()) return;

    cards.forEach((card) => {
      let frameId = null;
      let isReady = !card.classList.contains("reveal");

      // Aguarda o fim da animação de entrada.
      if (!isReady) {
        card.addEventListener("transitionend", (event) => {
          if (
            event.target === card &&
            event.propertyName === "transform" &&
            card.classList.contains("visible")
          ) {
            isReady = true;
          }
        });

        // Fallback para casos sem transitionend.
        const observer = new MutationObserver(() => {
          if (!card.classList.contains("visible")) return;

          observer.disconnect();

          window.setTimeout(() => {
            isReady = true;
          }, 900);
        });

        observer.observe(card, {
          attributes: true,
          attributeFilter: ["class"]
        });

        if (card.classList.contains("visible")) {
          observer.disconnect();
          isReady = true;
        }
      }

      function resetCard() {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
          frameId = null;
        }

        card.style.transform = "";
      }

      card.addEventListener("pointermove", (event) => {
        if (!isReady || isReducedMotion()) return;

        const rect = card.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 6;
        const rotateX = (0.5 - y) * 6;

        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }

        frameId = requestAnimationFrame(() => {
          card.style.transform = `
            perspective(1000px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            translateY(-3px)
          `;

          frameId = null;
        });
      }, { passive: true });

      card.addEventListener("pointerleave", resetCard);

      reducedMotionQuery.addEventListener("change", resetCard);
    });
  }

  initTiltCards();

  /* 05. TIMELINE INTERATIVA */

  function initProcessTimeline() {
    const timeline = document.querySelector(".process-timeline");
    const progress = document.querySelector(".timeline-progress");
    const steps = [...document.querySelectorAll(".process-step")];

    if (!timeline || !progress || !steps.length) return;

    let ticking = false;

    function updateTimeline() {
      ticking = false;

      // A linha é exclusiva do layout desktop.
      if (window.innerWidth <= 992) {
        progress.style.width = "0%";

        steps.forEach(step => {
          step.classList.remove("active");
        });

        return;
      }

      const rect = timeline.getBoundingClientRect();

      // Ponto de referência dentro da tela.
      const triggerPosition = window.innerHeight * 0.7;

      // O progresso começa quando a seção entra
      // na região de leitura e termina mais adiante.
      const scrollDistance = Math.max(
        rect.height + window.innerHeight * 0.25,
        1
      );

      const rawProgress =
        (triggerPosition - rect.top) / scrollDistance;

      const normalizedProgress = Math.min(
        1,
        Math.max(0, rawProgress)
      );

      progress.style.width = `${normalizedProgress * 100}%`;

      steps.forEach((step, index) => {
        const threshold =
          steps.length === 1
            ? 0
            : index / (steps.length - 1);

        step.classList.toggle(
          "active",
          normalizedProgress >= threshold &&
          normalizedProgress > 0
        );
      });
    }

    function requestUpdate() {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(updateTimeline);
    }

    window.addEventListener("scroll", requestUpdate, {
      passive: true
    });

    window.addEventListener("resize", requestUpdate, {
      passive: true
    });

    updateTimeline();
  }

  initProcessTimeline();
  
  /* 06. PARTÍCULAS DO HERO — OTIMIZADO */

  function initParticles() {
    const canvas = document.querySelector("#particles-canvas");

    if (!canvas) return;

    const ctx = canvas.getContext("2d", {
      alpha: true
    });

    if (!ctx) return;

    const container = canvas.parentElement;

    if (!container) return;

    const mobileQuery = window.matchMedia(
      "(max-width: 768px)"
    );

    const config = {
      desktopParticles: 45,
      mobileParticles: 18,
      connectionDistance: 110,
      mouseRadius: 135,
      speed: 0.25
    };

    let particles = [];
    let width = 0;
    let height = 0;

    let frameId = null;
    let lastFrameTime = 0;

    let visible = false;

    const pointer = {
      x: -1000,
      y: -1000,
      active: false
    };

    function isMobile() {
      return mobileQuery.matches;
    }

    function getTargetFPS() {
      return isMobile() ? 30 : 60;
    }

    function canAnimate() {
      return (
        visible &&
        !document.hidden &&
        !isReducedMotion()
      );
    }

    /* PARTÍCULA */

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;

        this.radius = Math.random() * 1.4 + 0.4;

        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;

        this.alpha = Math.random() * 0.4 + 0.15;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x <= 0 || this.x >= width) {
          this.vx *= -1;
        }

        if (this.y <= 0 || this.y >= height) {
          this.vy *= -1;
        }

        if (pointer.active && hasFinePointer()) {
          const dx = this.x - pointer.x;
          const dy = this.y - pointer.y;

          const distance = Math.hypot(dx, dy);

          if (
            distance > 0 &&
            distance < config.mouseRadius
          ) {
            const force =
              (1 - distance / config.mouseRadius) * 0.3;

            this.x += (dx / distance) * force;
            this.y += (dy / distance) * force;
          }
        }
      }

      draw() {
        ctx.beginPath();

        ctx.arc(
          this.x,
          this.y,
          this.radius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          `rgba(180, 150, 255, ${this.alpha})`;

        ctx.fill();
      }
    }

    /* CRIAÇÃO */

    function createParticles() {
      const count = isMobile()
        ? config.mobileParticles
        : config.desktopParticles;

      particles = Array.from(
        { length: count },
        () => new Particle()
      );
    }

    /* CONEXÕES */

    function drawConnections() {
      const maxDistance = config.connectionDistance;
      const maxDistanceSquared = maxDistance ** 2;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];

          const dx = a.x - b.x;
          const dy = a.y - b.y;

          const distanceSquared = dx * dx + dy * dy;

          if (distanceSquared >= maxDistanceSquared) {
            continue;
          }

          const opacity =
            (1 - Math.sqrt(distanceSquared) / maxDistance)
            * 0.13;

          ctx.beginPath();

          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);

          ctx.strokeStyle =
            `rgba(139, 100, 255, ${opacity})`;

          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    /* DESENHO */

    function drawScene() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      drawConnections();
    }

    /* LOOP */

    function animate(timestamp) {
      if (!canAnimate()) {
        stopAnimation();
        return;
      }

      frameId = requestAnimationFrame(animate);

      const interval = 1000 / getTargetFPS();
      const elapsed = timestamp - lastFrameTime;

      if (elapsed < interval) return;

      lastFrameTime =
        timestamp - (elapsed % interval);

      drawScene();
    }

    function startAnimation() {
      if (!canAnimate() || frameId !== null) {
        return;
      }

      lastFrameTime = 0;
      frameId = requestAnimationFrame(animate);
    }

    function stopAnimation() {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    }

    /* REDIMENSIONAMENTO */

    function resizeCanvas() {
      const rect = container.getBoundingClientRect();

      const newWidth = Math.round(rect.width);
      const newHeight = Math.round(rect.height);

      if (
        newWidth === width &&
        newHeight === height
      ) {
        return;
      }

      width = newWidth;
      height = newHeight;

      if (width <= 0 || height <= 0) {
        stopAnimation();
        return;
      }

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      createParticles();

      if (isReducedMotion()) {
        ctx.clearRect(0, 0, width, height);
      }
    }

    /* INTERAÇÃO COM CURSOR */

    container.addEventListener(
      "pointermove",
      event => {
        if (!hasFinePointer()) return;

        const rect = canvas.getBoundingClientRect();

        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
      },
      { passive: true }
    );

    container.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    /* VISIBILIDADE */

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        entries => {
          visible = entries[0].isIntersecting;

          if (visible) {
            startAnimation();
          } else {
            stopAnimation();
          }
        },
        { threshold: 0 }
      );

      observer.observe(container);
    } else {
      visible = true;
    }

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          stopAnimation();
        } else {
          startAnimation();
        }
      }
    );

    /* MOVIMENTO REDUZIDO */

    reducedMotionQuery.addEventListener(
      "change",
      () => {
        if (isReducedMotion()) {
          stopAnimation();
          ctx.clearRect(0, 0, width, height);
        } else {
          startAnimation();
        }
      }
    );

    /* RESPONSIVIDADE */

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(
        resizeCanvas
      );

      resizeObserver.observe(container);
    } else {
      window.addEventListener(
        "resize",
        resizeCanvas,
        { passive: true }
      );
    }

    mobileQuery.addEventListener("change", () => {
      createParticles();
      stopAnimation();
      startAnimation();
    });

    /* INICIALIZAÇÃO */

    resizeCanvas();
    startAnimation();
  }

  initParticles();


  /* 07. INICIALIZAÇÃO CONCLUÍDA */

  console.info(
    "NJG Software: motor de animações inicializado."
  );

});
