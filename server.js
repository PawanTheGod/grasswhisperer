/**
 * GrassWhisperer Server
 * Local AI outdoor companion powered by Ollama (open-source)
 * No API keys. No data sent to external servers. Runs on your laptop.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3333;
const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'llama3.2:1b'; // Tiny, fast, runs on any laptop

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Ollama helper ────────────────────────────────────────────────────────────
function ollamaChat(systemPrompt, userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      options: { temperature: 0.7, num_predict: 512 }
    });

    const req = http.request(
      `${OLLAMA_URL}/api/chat`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.message?.content || json.response || '');
          } catch (e) { reject(new Error('Failed to parse Ollama response')); }
        });
      }
    );
    req.on('error', (e) => reject(new Error(`Ollama not reachable: ${e.message}. Run: ollama serve`)));
    req.write(body);
    req.end();
  });
}

function ollamaStatus() {
  return new Promise((resolve) => {
    http.get(`${OLLAMA_URL}/api/tags`, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const models = json.models?.map(m => m.name) || [];
          resolve({ running: true, models, hasModel: models.some(m => m.startsWith('llama3.2')) });
        } catch { resolve({ running: true, models: [], hasModel: false }); }
      });
    }).on('error', () => resolve({ running: false, models: [], hasModel: false }));
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health / status
app.get('/api/status', async (req, res) => {
  const status = await ollamaStatus();
  res.json({ ...status, model: MODEL });
});

// 🐦 Bird Whisperer — identify bird from description
app.post('/api/bird', async (req, res) => {
  const { description, location, season } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });

  const system = `You are a friendly field ornithologist. When given a bird description, 
identify the most likely bird species. Respond in this EXACT JSON format (no markdown):
{
  "name": "Common Name",
  "scientific": "Scientific name",
  "confidence": "high/medium/low",
  "description": "2-3 sentences about this bird",
  "calls": "What its call sounds like (describe with words like 'cheerio-cheerio' or 'fee-bee')",
  "habitat": "Where to find it",
  "funFact": "One surprising fact",
  "look_for": "Key identification tips outdoors"
}`;

  const user = `Bird description: "${description}"${location ? `\nLocation: ${location}` : ''}${season ? `\nSeason: ${season}` : ''}`;

  try {
    const raw = await ollamaChat(system, user);
    // Try to extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({ success: true, bird: parsed, raw });
    } else {
      res.json({ success: true, bird: null, raw });
    }
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// 🌱 Garden Oracle — what to plant this week
app.post('/api/garden', async (req, res) => {
  const { location, zone, month } = req.body;
  if (!location && !zone) return res.status(400).json({ error: 'Location or zone required' });

  const system = `You are a master gardener with deep knowledge of planting calendars, frost dates, and seasonal gardening. 
Give practical, actionable planting advice. Respond in EXACT JSON format (no markdown):
{
  "frostInfo": "Approximate frost dates for this location/zone",
  "thisWeek": ["action 1", "action 2", "action 3", "action 4"],
  "plantNow": [
    {"plant": "name", "why": "reason", "tip": "practical tip"},
    {"plant": "name", "why": "reason", "tip": "practical tip"},
    {"plant": "name", "why": "reason", "tip": "practical tip"}
  ],
  "waitUntil": ["plant that needs to wait - timeframe"],
  "soilTask": "One soil preparation task for this week",
  "outdoorTip": "One tip to make gardening more enjoyable today"
}`;

  const user = `Location/Region: ${location || 'unknown'}${zone ? `\nUSDA Zone: ${zone}` : ''}\nCurrent month: ${month || new Date().toLocaleString('default', { month: 'long' })}`;

  try {
    const raw = await ollamaChat(system, user);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({ success: true, garden: parsed });
    } else {
      res.json({ success: true, garden: null, raw });
    }
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// 🥾 Trail Finder — best routes for the season
app.post('/api/trail', async (req, res) => {
  const { location, difficulty, duration, interest } = req.body;
  if (!location) return res.status(400).json({ error: 'Location required' });

  const system = `You are an outdoor adventure guide specializing in hiking and nature walks.
Give helpful, specific trail and outdoor activity advice. Respond in EXACT JSON format (no markdown):
{
  "headline": "Catchy headline for today's outdoor adventure",
  "season_note": "What's special about being outside right now (fall foliage, wildflowers, etc.)",
  "trails": [
    {
      "name": "Trail or area name",
      "type": "loop/out-and-back/point-to-point",
      "distance": "approximate distance",
      "difficulty": "easy/moderate/hard",
      "highlight": "What makes this special right now",
      "tip": "Practical tip for this specific trail/season"
    }
  ],
  "gear": ["essential item 1", "essential item 2", "essential item 3"],
  "leaveNoTrace": "One LNT tip relevant to current season",
  "bonus": "Fun outdoor challenge or nature activity to do on the trail"
}`;

  const user = `Location: ${location}\nDifficulty preference: ${difficulty || 'any'}\nAvailable time: ${duration || 'half day'}\nInterest: ${interest || 'general hiking and nature'}`;

  try {
    const raw = await ollamaChat(system, user);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({ success: true, trail: parsed });
    } else {
      res.json({ success: true, trail: null, raw });
    }
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// 🤔 Ask Nature — free-form outdoor Q&A
app.post('/api/ask', async (req, res) => {
  const { question, context } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });

  const system = `You are GrassWhisperer, a knowledgeable and enthusiastic outdoor companion AI.
You help people connect with nature — hiking, birding, gardening, running, foraging (safely!), stargazing, and more.
You run locally on their device — no internet needed, no data sent anywhere. Be concise, warm, and practical.
Always encourage people to get outside. Format your response in plain text with emoji for readability. Max 200 words.`;

  const user = `${context ? `Context: ${context}\n\n` : ''}Question: ${question}`;

  try {
    const answer = await ollamaChat(system, user);
    res.json({ success: true, answer });
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n🌿 GrassWhisperer is running!');
  console.log(`   Open: http://localhost:${PORT}`);
  console.log(`   Model: ${MODEL} (via Ollama — runs 100% locally)`);
  console.log('   No API keys. No data sent anywhere. Touch grass! 🥾\n');
});
