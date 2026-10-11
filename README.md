# 🌿 GrassWhisperer

> **Hacktoberfest 2024 · Challenge 1: Touch Grass**  
> Local AI outdoor companion — 100% open-source, runs on your laptop, no internet needed.

---

## What It Does

GrassWhisperer is a **local-first AI app** that helps you get off the screen and into the world:

| Feature | Description |
|---|---|
| 🐦 **Bird Whisperer** | Describe what you see or hear — get an instant ID with field tips |
| 🌱 **Garden Oracle** | Enter your city/zone, get a personalized weekly planting calendar |
| 🥾 **Trail Finder** | Find the best hike near you for the season (fall foliage, wildflowers, etc.) |
| 🤔 **Ask Nature** | Free-form Q&A — foraging, stargazing, wildlife tracking, gear |

## Why Open Source Matters Here

This runs **entirely on your laptop using [Ollama](https://ollama.com) + llama3.2:1b** — a tiny open-weight model that fits in under 1GB of RAM.

- ✅ **Works offline on the trail** — no cell signal needed
- ✅ **Your data never leaves your device** — no API keys, no telemetry, no accounts
- ✅ **Swap models freely** — change `MODEL` in `server.js` to any Ollama model
- ✅ **Costs nothing to run** — no per-query fees, ever
- ✅ **Fine-tune it** — swap to a domain-specific model like a bird-focused GGUF anytime
- ✅ **Runs on cheap hardware** — tested on a 4-year-old laptop with 8GB RAM

A closed alternative (GPT-4o, Gemini, Claude) would charge per query, require an internet connection, log your data, and lock you into one provider. Open-source wins here in every dimension that matters for an outdoor tool.

---

## Quick Start

### 1. Install Ollama
Download from [ollama.com](https://ollama.com) and install it.

### 2. Start Ollama and pull the model
```bash
ollama serve          # starts the local AI server
ollama pull llama3.2:1b   # ~700MB download, one time only
```

### 3. Clone and run GrassWhisperer
```bash
cd challenge-1-touch-grass
npm install
npm start
```

Then open **http://localhost:3333** 🌿

### Optional: Auto-setup
```bash
npm run setup   # checks Ollama + pulls model automatically
```

---

## Tech Stack

| Layer | Technology | Why open? |
|---|---|---|
| AI Runtime | [Ollama](https://ollama.com) | MIT license, runs locally |
| Model | llama3.2:1b (Meta) | Open weights, commercially usable |
| Server | Node.js + Express | Zero-dependency, trivial to run |
| Frontend | Vanilla HTML/CSS/JS | No build step, works everywhere |
| Fonts | Google Fonts (Outfit, Fraunces) | Free and open |

---

## How It Works

```
Browser → Express (localhost:3333) → Ollama API (localhost:11434) → llama3.2:1b
                                          ↑
                              Runs entirely on your machine
```

Each feature sends a carefully crafted system prompt to Ollama and parses the structured JSON response back into a beautiful UI. No internet connection is made after setup.

---

## Customization

**Change the model** (in `server.js`):
```js
const MODEL = 'llama3.2:3b';   // larger, smarter
const MODEL = 'phi3:mini';      // Microsoft's tiny model
const MODEL = 'mistral';        // great for instructions
```

**Try these models for better quality:**
```bash
ollama pull llama3.2:3b    # better quality, ~2GB
ollama pull phi3:mini      # very fast
ollama pull mistral        # excellent reasoning
```

---

## Hacktoberfest Submission

**Open innovation matters here because:**

> A bird ID app that needs the cloud to work doesn't work when you need it most — in the middle of the woods with no signal. GrassWhisperer runs on your phone's hotspot data budget: zero. The open weights, open runtime, and open code mean you own this tool. Swap the model. Fine-tune it on your local bird list. Run it on a $35 Raspberry Pi at your trail head. This is what open-source AI unlocks that GPT-4o never will.

---

*Made with 🌿 for Hacktoberfest 2024*
