# TigrimOSR — Website

Marketing / landing site for [TigrimOSR](https://github.com/Sompote/TigrimOSR), the open-graph agentic platform. Clean white ChatGPT-style theme with interactive canvas graphics.

## Structure

- `index.html` — single-page site (hero, stats, swarm modes, agent loop YAML, agentic graph engineering, architecture, features, memory chart, screenshots, install, CTA)
- `style.css` — theme (white background, `#10a37f` accent, Inter + JetBrains Mono)
- `main.js` — interactions: ambient agent-network hero canvas, 6-mode swarm topology visualizer (click a node to burst messages), typed terminal, animated counters/bars, scroll reveals, install tabs, copy buttons, lightbox
- `assets/` — graphics pulled from the TigrimOSR repo README

## Run locally

No build step — any static server works:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Static hosting (GitHub Pages, Netlify, Cloudflare Pages…) — publish the folder as-is.
