# 🌿 GrassWhisperer v2.0

> **Hacktoberfest 2026 · Challenge 1: Touch Grass**  
> Complete Offline AI Outdoor Companion — 100% open-source, runs on your laptop, zero cloud, zero tracking.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![AI Engine: Ollama](https://img.shields.io/badge/AI%20Engine-Ollama%20(Open--Source)-green.svg)](https://ollama.com)
[![Weights: Open Weights](https://img.shields.io/badge/Weights-Meta%20Llama%203.2-blue.svg)](https://huggingface.co/meta-llama)
[![Privacy: Zero Telemetry](https://img.shields.io/badge/Privacy-100%25%20Air--Gapped-brightgreen.svg)](#why-open-innovation-matters)

---

## 🌟 What It Does

GrassWhisperer is an offline-first naturalist operating system designed to get people off their screens and into the wild. Built around open-weight models running on Ollama, it provides 6 specialized field tools:

| Feature | Description |
|---|---|
| 🐦 **Bird Whisperer** | Describe plumage, behavior, or song phonetics (`"swee-swee-chur"`) — identifies species with field tips and synthetic audio playback |
| 🍄 **Plant Spotter** | Botanical key analysis with rigorous safety warnings, edible versus toxic classifications, and lethal look-alike alerts |
| 🌱 **Garden Oracle** | Regional horticultural calendar, USDA hardiness zone awareness, frost timelines, and interactive weekly checklists |
| 🥾 **Trail Finder** | Custom route profiles by difficulty, distance, and elevation gain with pack checklists and Leave-No-Trace principles |
| 🌤️ **Outdoor Timing** | Identifies optimal daylight windows (Golden Hour, dawn chorus), celestial sky events, and 10-minute micro-challenges |
| 🤔 **Ask Nature** | Conversational wilderness expert for navigation, tracking spoor, barometric cloud reading, and survival skills |

### 🚀 Additional Product Capabilities
- 📖 **Offline Field Journal**: Bookmark any observation to `localStorage`; export the full journal as clean Markdown for field notebooks.
- 📍 **One-Click Location Sync**: Auto-detects coordinates and region to prime weather and phenology queries.
- 🔊 **Synthesized Field Audio**: Leverages browser Web Speech API to vocalize bird calls phonetically and read field tips aloud on the trail.
- ⚙️ **Hot Model Switching**: Seamlessly switch between `llama3.2:1b`, `llama3.2:3b`, `mistral`, and `phi3` straight from the UI.

---

## 🛡️ Why Open Innovation Matters Here

GrassWhisperer is fundamentally built around open-source AI:

1. **True Backcountry Offline Utility**: Nature doesn't have 5G bars. When you're 8 miles into a mountain trail with zero signal, closed-cloud APIs (OpenAI, Anthropic, Google) are completely useless. Ollama + Llama 3.2 runs on your laptop battery with airplane mode turned on.
2. **Total Privacy & Zero Data Harvesting**: Your personal garden location, coordinates, foraging spots, and queries are never logged, mined, or sold. Everything stays on `localhost`.
3. **Zero Operating Cost**: Free forever. No API credit tokens, monthly subscriptions, rate limits, or surprise bills.
4. **Model Freedom & Portability**: You are never vendor locked. Swap weights at will — run Meta Llama 3.2, Mistral, Microsoft Phi-3, or custom fine-tuned wildlife GGUF weights.
5. **Transparency & Hackability**: Pure open code. Inspect every system prompt, tweak horticultural logic, and contribute improvements directly.

---

## ⚡ Quick Start

### 1. Install & Launch Ollama
Download Ollama from [ollama.com](https://ollama.com):

```bash
ollama serve
ollama pull llama3.2:1b    # ~700MB, lightning fast on laptops
```

*(Optional: For higher reasoning, run `ollama pull llama3.2:3b`)*

### 2. Run GrassWhisperer
```bash
git clone https://github.com/PawanTheGod/grasswhisperer.git
cd grasswhisperer
npm install
npm start
```

Open **http://localhost:3333** 🌿

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Interface                       │
│  Vanilla HTML5 + Modern CSS + Web Speech API + Geolocation  │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                  Express Node.js Server                     │
│    localhost:3333 · Prompt Orchestration & JSON Parsing     │
└──────────────────────────────▲──────────────────────────────┘
                               │ Loopback Port 11434
┌──────────────────────────────▼──────────────────────────────┐
│                    Ollama Runtime Daemon                    │
│      llama3.2:1b / llama3.2:3b / mistral (Open Weights)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📜 License
MIT License. Built with ❤️ for Hacktoberfest 2026.
