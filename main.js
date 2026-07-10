/* ============================================================
   TigrimOSR site — interactions & canvas graphics
   ============================================================ */
(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const ACCENT = "#10a37f";
  const ACCENT_DARK = "#0c8a6a";
  const GRAY = "#c7c7d1";
  const INK = "#0d0d0d";

  /* ---------- nav ---------- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = document.getElementById("navBurger");
  const navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.addEventListener("click", () => navLinks.classList.remove("open"));

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------- animated counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const to = +e.target.dataset.to;
      const t0 = performance.now();
      const dur = 1200;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll(".count").forEach((el) => countIO.observe(el));

  /* ---------- typed terminal ---------- */
  const termLines = [
    { text: "$ tigrimos --headless", cls: "" },
    { text: "✔ Rust core online — 1 binary, 0 runtimes", cls: "ok" },
    { text: "✔ Swarm ready: 5 agents · mode=hierarchical", cls: "ok" },
    { text: "✔ Web UI → http://127.0.0.1:3001  (~270 MB RAM)", cls: "ok" },
  ];
  const termEl = document.getElementById("typedTerm");
  let li = 0, ci = 0;
  const typeStep = () => {
    if (li >= termLines.length) return;
    const line = termLines[li];
    ci++;
    termEl.textContent = termLines.slice(0, li).map((l) => l.text).join("\n") +
      (li ? "\n" : "") + line.text.slice(0, ci);
    if (ci >= line.text.length) { li++; ci = 0; setTimeout(typeStep, li === 1 ? 500 : 260); }
    else setTimeout(typeStep, line.text.startsWith("$") ? 55 : 12);
  };
  setTimeout(typeStep, 600);

  /* ============================================================
     HERO — ambient agent-network particles
     ============================================================ */
  const heroCanvas = document.getElementById("heroCanvas");
  const hctx = heroCanvas.getContext("2d");
  let hw = 0, hh = 0, dots = [];
  const mouse = { x: -9999, y: -9999 };

  function heroResize() {
    const r = heroCanvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    hw = r.width; hh = r.height;
    heroCanvas.width = hw * dpr; heroCanvas.height = hh * dpr;
    hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(70, Math.floor(hw / 18));
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * hw, y: Math.random() * hh,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: 1.4 + Math.random() * 2.2,
    }));
  }
  heroResize();
  window.addEventListener("resize", heroResize);
  heroCanvas.parentElement.addEventListener("mousemove", (e) => {
    const r = heroCanvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  heroCanvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });

  function heroFrame() {
    hctx.clearRect(0, 0, hw, hh);
    const LINK = 130;
    for (const d of dots) {
      d.x += d.vx; d.y += d.vy;
      if (d.x < -10) d.x = hw + 10; if (d.x > hw + 10) d.x = -10;
      if (d.y < -10) d.y = hh + 10; if (d.y > hh + 10) d.y = -10;
      // gentle attraction to cursor
      const mdx = mouse.x - d.x, mdy = mouse.y - d.y;
      const md = Math.hypot(mdx, mdy);
      if (md < 200 && md > 1) { d.x += (mdx / md) * 0.25; d.y += (mdy / md) * 0.25; }
    }
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < LINK) {
          hctx.strokeStyle = `rgba(16,163,127,${(1 - dist / LINK) * 0.16})`;
          hctx.lineWidth = 1;
          hctx.beginPath(); hctx.moveTo(a.x, a.y); hctx.lineTo(b.x, b.y); hctx.stroke();
        }
      }
    }
    for (const d of dots) {
      hctx.fillStyle = "rgba(16,163,127,.35)";
      hctx.beginPath(); hctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); hctx.fill();
    }
    requestAnimationFrame(heroFrame);
  }
  requestAnimationFrame(heroFrame);

  /* ============================================================
     SWARM MODE VISUALIZER
     ============================================================ */
  const MODES = {
    hierarchical: {
      caption: "An orchestrator delegates down a tree of managers and specialist workers.",
      build(w, h) {
        const nodes = [
          { x: .5, y: .16, r: 22, label: "Orchestrator", hub: true },
          { x: .28, y: .48, r: 16, label: "Manager A" },
          { x: .72, y: .48, r: 16, label: "Manager B" },
          { x: .14, y: .8, r: 12, label: "Coder" },
          { x: .40, y: .8, r: 12, label: "Researcher" },
          { x: .60, y: .8, r: 12, label: "Tester" },
          { x: .86, y: .8, r: 12, label: "Writer" },
        ];
        const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];
        return { nodes, edges, directed: true };
      },
    },
    mesh: {
      caption: "Every agent talks to every other agent over TCP / Bus — full peer connectivity.",
      build() {
        const N = 6, nodes = [], edges = [];
        const labels = ["Planner","Coder","Critic","Search","Judge","Docs"];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          nodes.push({ x: .5 + Math.cos(a) * .34, y: .5 + Math.sin(a) * .36, r: 15, label: labels[i] });
        }
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) edges.push([i, j]);
        return { nodes, edges, directed: false };
      },
    },
    hybrid: {
      caption: "A hierarchy on top, a collaborating mesh underneath — the best of both.",
      build() {
        const nodes = [
          { x: .5, y: .14, r: 20, label: "Orchestrator", hub: true },
          { x: .3, y: .44, r: 15, label: "Lead A" },
          { x: .7, y: .44, r: 15, label: "Lead B" },
          { x: .22, y: .8, r: 12, label: "Coder" },
          { x: .44, y: .82, r: 12, label: "Search" },
          { x: .62, y: .82, r: 12, label: "Judge" },
          { x: .8, y: .8, r: 12, label: "Docs" },
        ];
        const edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,4],[4,5],[5,6],[1,2]];
        return { nodes, edges, directed: false };
      },
    },
    pipeline: {
      caption: "Work flows agent → agent like a FIFO queue: plan, build, verify, ship.",
      build() {
        const labels = ["Intake","Plan","Build","Verify","Ship"];
        const nodes = labels.map((label, i) => ({
          x: .1 + i * .2, y: .5, r: i === 3 ? 17 : 15, label,
        }));
        const edges = [[0,1],[1,2],[2,3],[3,4]];
        return { nodes, edges, directed: true };
      },
    },
    p2p: {
      caption: "No boss. Peers negotiate directly and share state on the blackboard.",
      build() {
        const N = 7, nodes = [], edges = [];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          nodes.push({ x: .5 + Math.cos(a) * .35, y: .5 + Math.sin(a) * .37, r: 14, label: "Peer " + (i + 1) });
        }
        for (let i = 0; i < N; i++) edges.push([i, (i + 1) % N]);
        edges.push([0, 3], [1, 4], [2, 5]);
        return { nodes, edges, directed: false };
      },
    },
    orchestrator: {
      caption: "Peers collaborate directly, while a P2P orchestrator coordinates the swarm.",
      build() {
        const N = 6, nodes = [{ x: .5, y: .5, r: 21, label: "Orchestrator", hub: true }], edges = [];
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2 - Math.PI / 2;
          nodes.push({ x: .5 + Math.cos(a) * .35, y: .5 + Math.sin(a) * .37, r: 14, label: "Agent " + (i + 1) });
        }
        for (let i = 1; i <= N; i++) {
          edges.push([0, i]);
          edges.push([i, i === N ? 1 : i + 1]);
        }
        return { nodes, edges, directed: false };
      },
    },
  };

  const swarmCanvas = document.getElementById("swarmCanvas");
  const sctx = swarmCanvas.getContext("2d");
  const swarmCaption = document.getElementById("swarmCaption");
  let sw = 0, sh = 0, graph = null, pulses = [], swarmMode = "hierarchical";
  const sMouse = { x: -9999, y: -9999 };
  let hoverNode = -1;

  function swarmResize() {
    const r = swarmCanvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    sw = r.width; sh = r.height;
    swarmCanvas.width = sw * dpr; swarmCanvas.height = sh * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  swarmResize();
  window.addEventListener("resize", swarmResize);

  function setMode(mode) {
    swarmMode = mode;
    graph = MODES[mode].build();
    swarmCaption.textContent = MODES[mode].caption;
    pulses = [];
    // node entrance animation state
    graph.nodes.forEach((n, i) => { n.t = 0; n.delay = i * 60; n.born = performance.now(); });
  }
  setMode("hierarchical");

  document.getElementById("swarmTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".swarm-tab");
    if (!btn) return;
    document.querySelectorAll(".swarm-tab").forEach((b) => b.classList.toggle("active", b === btn));
    setMode(btn.dataset.mode);
  });

  swarmCanvas.addEventListener("mousemove", (e) => {
    const r = swarmCanvas.getBoundingClientRect();
    sMouse.x = e.clientX - r.left; sMouse.y = e.clientY - r.top;
  });
  swarmCanvas.addEventListener("mouseleave", () => { sMouse.x = sMouse.y = -9999; });
  // click a node to burst pulses from it
  swarmCanvas.addEventListener("click", () => {
    if (hoverNode < 0 || !graph) return;
    graph.edges.forEach(([a, b], ei) => {
      if (a === hoverNode || b === hoverNode) {
        pulses.push({ edge: ei, t: 0, fwd: a === hoverNode, speed: .02 });
      }
    });
  });

  function nodeXY(n) {
    const pad = 46;
    return { x: pad + n.x * (sw - pad * 2), y: pad * 0.9 + n.y * (sh - pad * 2.4) };
  }

  function swarmFrame(now) {
    if (!graph) { requestAnimationFrame(swarmFrame); return; }
    sctx.clearRect(0, 0, sw, sh);
    const pts = graph.nodes.map(nodeXY);

    // hover detection
    hoverNode = -1;
    pts.forEach((p, i) => {
      if (Math.hypot(sMouse.x - p.x, sMouse.y - p.y) < graph.nodes[i].r + 12) hoverNode = i;
    });
    swarmCanvas.style.cursor = hoverNode >= 0 ? "pointer" : "default";

    // edges
    graph.edges.forEach(([a, b]) => {
      const hot = hoverNode === a || hoverNode === b;
      sctx.strokeStyle = hot ? "rgba(16,163,127,.55)" : "rgba(13,13,13,.10)";
      sctx.lineWidth = hot ? 2 : 1.4;
      sctx.beginPath(); sctx.moveTo(pts[a].x, pts[a].y); sctx.lineTo(pts[b].x, pts[b].y); sctx.stroke();
    });

    // spontaneous pulses
    if (Math.random() < 0.05 && pulses.length < 14) {
      const ei = Math.floor(Math.random() * graph.edges.length);
      pulses.push({ edge: ei, t: 0, fwd: graph.directed ? true : Math.random() < 0.5, speed: 0.008 + Math.random() * 0.008 });
    }
    pulses = pulses.filter((p) => p.t <= 1);
    for (const p of pulses) {
      p.t += p.speed;
      const [a, b] = graph.edges[p.edge];
      const A = pts[p.fwd ? a : b], B = pts[p.fwd ? b : a];
      const x = A.x + (B.x - A.x) * p.t, y = A.y + (B.y - A.y) * p.t;
      const g = sctx.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, "rgba(16,163,127,.95)");
      g.addColorStop(1, "rgba(16,163,127,0)");
      sctx.fillStyle = g;
      sctx.beginPath(); sctx.arc(x, y, 7, 0, Math.PI * 2); sctx.fill();
    }

    // nodes
    graph.nodes.forEach((n, i) => {
      const p = pts[i];
      const age = Math.max(0, now - n.born - n.delay);
      const grow = Math.min(1, age / 350);
      const ease = 1 - Math.pow(1 - grow, 3);
      const rr = n.r * ease;
      if (rr <= 0.5) return;
      const hot = hoverNode === i;
      const bob = Math.sin(now / 900 + i * 1.7) * 2.4;
      const y = p.y + bob;

      if (n.hub) {
        sctx.strokeStyle = "rgba(16,163,127,.25)";
        sctx.lineWidth = 2;
        const ringR = rr + 8 + Math.sin(now / 500) * 2;
        sctx.beginPath(); sctx.arc(p.x, y, ringR, 0, Math.PI * 2); sctx.stroke();
      }
      sctx.fillStyle = n.hub ? ACCENT : hot ? ACCENT_DARK : "#ffffff";
      sctx.strokeStyle = n.hub || hot ? ACCENT_DARK : "rgba(13,13,13,.22)";
      sctx.lineWidth = 1.8;
      sctx.beginPath(); sctx.arc(p.x, y, rr, 0, Math.PI * 2); sctx.fill(); sctx.stroke();
      // inner dot
      sctx.fillStyle = n.hub || hot ? "#ffffff" : ACCENT;
      sctx.beginPath(); sctx.arc(p.x, y, Math.max(1.5, rr * 0.28), 0, Math.PI * 2); sctx.fill();
      // label
      sctx.fillStyle = hot ? INK : "rgba(13,13,13,.62)";
      sctx.font = `${hot ? "600 " : ""}12px Inter, sans-serif`;
      sctx.textAlign = "center";
      sctx.fillText(n.label, p.x, y + rr + 18);
    });

    requestAnimationFrame(swarmFrame);
  }
  requestAnimationFrame(swarmFrame);

  /* ---------- memory chart ---------- */
  const memIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      memIO.unobserve(e.target);
      e.target.querySelectorAll(".mem-bar").forEach((bar, i) => {
        setTimeout(() => { bar.style.width = bar.dataset.w + "%"; }, 150 + i * 220);
      });
    });
  }, { threshold: 0.4 });
  memIO.observe(document.getElementById("memChart"));

  /* ---------- install tabs ---------- */
  document.getElementById("installTabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".install-tab");
    if (!btn) return;
    document.querySelectorAll(".install-tab").forEach((b) => b.classList.toggle("active", b === btn));
    document.querySelectorAll(".install-pane").forEach((p) =>
      p.classList.toggle("active", p.id === btn.dataset.target));
  });

  /* ---------- copy buttons ---------- */
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      let text = "";
      if (btn.dataset.copy) text = document.getElementById(btn.dataset.copy).innerText;
      else text = btn.parentElement.querySelector("code").innerText;
      try { await navigator.clipboard.writeText(text); } catch (_) {}
      const old = btn.textContent;
      btn.textContent = "Copied!"; btn.classList.add("done");
      setTimeout(() => { btn.textContent = old; btn.classList.remove("done"); }, 1600);
    });
  });

  /* ---------- lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightboxImg");
  const lbCap = document.getElementById("lightboxCap");
  document.querySelectorAll("[data-lightbox]").forEach((img) => {
    img.addEventListener("click", () => {
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      const cap = img.closest("figure")?.querySelector("figcaption");
      lbCap.textContent = cap ? cap.textContent : img.alt;
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });
  const closeLb = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
  lb.addEventListener("click", (e) => { if (e.target !== lbImg) closeLb(); });
  document.getElementById("lightboxClose").addEventListener("click", closeLb);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });
})();
