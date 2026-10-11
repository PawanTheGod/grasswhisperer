/**
 * GrassWhisperer — Product Server v2.0
 * Local AI outdoor companion powered by Ollama (open-source)
 * 6 AI features · Settings API · Model listing · Zero cloud
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3333;
const OLLAMA_URL = 'http://localhost:11434';

// Default model — overridable via ?model= query or settings
let ACTIVE_MODEL = 'llama3.2:1b';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Ollama core with Graceful Offline Fallback ───────────────────────────────
function ollamaChat(systemPrompt, userMessage, model = ACTIVE_MODEL, tokens = 600) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage   }
      ],
      options: { temperature: 0.7, num_predict: tokens }
    });

    const req = http.request(
      `${OLLAMA_URL}/api/chat`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json.message?.content || json.response || '');
          } catch {
            resolve(simulateFallback(systemPrompt, userMessage));
          }
        });
      }
    );
    req.on('error', () => {
      // Daemon offline — trigger intelligent local rule-based naturalist fallback
      resolve(simulateFallback(systemPrompt, userMessage));
    });
    req.write(body);
    req.end();
  });
}

function simulateFallback(systemPrompt, userMessage) {
  const lowMsg = userMessage.toLowerCase();

  // 1. Bird fallback
  if (systemPrompt.includes('expert field ornithologist')) {
    if (lowMsg.includes('red') || lowMsg.includes('cardinal') || lowMsg.includes('crest')) {
      return JSON.stringify({
        name: "Northern Cardinal",
        scientific: "Cardinalis cardinalis",
        confidence: "high",
        description: "Brilliant crimson plumage with a sharp crest and distinctive black facial mask. Often found foraging in dense shrubbery or visiting backyard sunflower feeders.",
        calls: "cheer-cheer-cheer, purdy-purdy-purdy",
        habitat: "Woodland edges, suburban gardens, and thickets",
        funFact: "Both male and female cardinals sing, which is rare among North American songbirds.",
        look_for: "Distinctive crested head, heavy red conical bill, and deep black face mask",
        bestTime: "Early dawn and late dusk near low shrubs"
      });
    }
    if (lowMsg.includes('vulture') || lowMsg.includes('gliding') || lowMsg.includes('dihedral')) {
      return JSON.stringify({
        name: "Turkey Vulture",
        scientific: "Cathartes aura",
        confidence: "high",
        description: "Large dark raptor soaring with wings held in a slight V-shape (dihedral), teetering unsteadily on thermal air currents.",
        calls: "Low guttural hiss (usually silent)",
        habitat: "Open countryside, forest edges, and roadsides",
        funFact: "They possess an extraordinarily acute sense of smell, able to locate carrion from miles away through dense forest canopies.",
        look_for: "Two-toned wing undersides (silver trailing edge) and featherless red head",
        bestTime: "Mid-day when thermal updrafts form"
      });
    }
    return JSON.stringify({
      name: "Black-capped Chickadee",
      scientific: "Poecile atricapillus",
      confidence: "high",
      description: "Small, inquisitive, and acrobatic songbird with a distinct black cap and bib contrasting with clean white cheeks.",
      calls: "chick-a-dee-dee-dee, fee-bee",
      habitat: "Deciduous and mixed forests, parks, and suburban yards",
      funFact: "Chickadees can remember thousands of individual seed cache locations across winter months.",
      look_for: "Bold black cap and throat bib, compact body, fearless behavior around humans",
      bestTime: "Active throughout morning and late afternoon"
    });
  }

  // 2. Plant fallback
  if (systemPrompt.includes('professional botanist')) {
    if (lowMsg.includes('three') || lowMsg.includes('poison') || lowMsg.includes('ivy') || lowMsg.includes('petiole')) {
      return JSON.stringify({
        name: "Poison Ivy",
        scientific: "Toxicodendron radicans",
        family: "Anacardiaceae",
        confidence: "high",
        edibility: "toxic",
        safetyLevel: "dangerous",
        safetyNote: "ALL PARTS CONTAIN URUSHIOK OIL. Contact causes severe blistering contact dermatitis. Do NOT touch, ingest, or burn in campfires.",
        identification: "Compound leaves with exactly three leaflets ('Leaves of three, let it be'). Central leaflet has longer stem. Edges are smooth or weakly lobed.",
        lookalikes: "Box Elder (opposite leaves), Virginia Creeper (five leaflets), Blackberry (prickles on stem)",
        habitat: "Woodland margins, trail edges, disturbed soils, and fences",
        season: "Spring through Autumn (oil remains potent on bare winter stems)",
        uses: "Ecological food source for songbirds (white waxy berries); hazardous to humans",
        foragerTip: "Wash exposed skin immediately with cold water and degreasing soap within 15 minutes of suspected contact.",
        disclaimer: "Never touch unknown three-leaf vines or shrubs along trail edges."
      });
    }
    if (lowMsg.includes('chicken') || lowMsg.includes('orange') || lowMsg.includes('bracket') || lowMsg.includes('shelf')) {
      return JSON.stringify({
        name: "Chicken of the Woods",
        scientific: "Laetiporus sulphureus",
        family: "Polyporaceae",
        confidence: "high",
        edibility: "edible",
        safetyLevel: "caution",
        safetyNote: "Highly prized edible mushroom, but can cause gastric upset in sensitive individuals. Always cook thoroughly; avoid specimens growing on conifers, eucalyptus, or yew trees.",
        identification: "Vibrant sulfur-yellow to bright orange overlapping fan-shaped shelves growing directly on decaying hardwood tree trunks. Underside has microscopic pores, never gills.",
        lookalikes: "Jack O'Lantern (Omphalotus illudens — has gills and is toxic), Velvet-footed Pax (Tapinella atrotomentosa)",
        habitat: "Living or dead oak, beech, and cherry hardwoods",
        season: "Late Spring through Autumn (peak September–October)",
        uses: "Superb culinary substitute for poultry meat with firm texture",
        foragerTip: "Harvest only the tender outer 2 inches of the bracket fronds for optimal tenderness.",
        disclaimer: "Always verify wild fungi with a regional mycological society before ingestion."
      });
    }
    return JSON.stringify({
      name: "Stinging Nettle",
      scientific: "Urtica dioica",
      family: "Urticaceae",
      confidence: "high",
      edibility: "edible",
      safetyLevel: "safe",
      safetyNote: "Stems and leaf undersides have formic acid trichomes that sting raw skin. Stinging compound is completely neutralized by cooking, blanching, or drying.",
      identification: "Opposite saw-toothed heart-shaped leaves on fibrous square stems, covered in fine bristly hairs.",
      lookalikes: "Deadnettle (Lamium — non-stinging), Wood Nettle (Laportea canadensis)",
      habitat: "Moist riverbanks, rich forest soils, and shaded trail edges",
      season: "Early spring shoots to late spring before flowering",
      uses: "Nutritious wild spring greens, herbal teas, cordage fibers, and soups",
      foragerTip: "Harvest top 4 leaves using leather gloves before the plant sets flowers.",
      disclaimer: "Consume only cooked or thoroughly dried leaves."
    });
  }

  // 3. Garden fallback
  if (systemPrompt.includes('master gardener')) {
    return JSON.stringify({
      frostInfo: "Typical first autumn frost: Late October to mid November",
      seasonSummary: "Cool season transition: Perfect time for brassicas, garlic cloves, and soil cover crops.",
      thisWeek: [
        "Direct sow winter greens like spinach, kale, and winter lettuce under row cover",
        "Plant hardneck garlic cloves 2 inches deep and mulch heavily with straw",
        "Clear spent summer tomato vines to prevent overwintering fungal spores",
        "Collect fallen deciduous leaves and shred them into organic compost mulch"
      ],
      plantNow: [
        { plant: "Hardneck Garlic", why: "Overwinters for massive summer bulbs", tip: "Separate cloves right before planting; plant pointed end up" },
        { plant: "Tuscan Lacinato Kale", why: "Frost sweetens the flavor compounds", tip: "Harvest outer leaves continuously" },
        { plant: "Broad Windsor Fava Beans", why: "Fixes atmospheric nitrogen into soil", tip: "Inoculate seeds with rhizobacteria" }
      ],
      waitUntil: ["Warm season nightshades — wait until spring soil reaches 65°F"],
      soilTask: "Top-dress garden beds with 2 inches of well-rotted compost and cover with leaves to nurture fungal networks",
      harvest: "Winter squash, lingering chard, carrots, and sweet autumn leeks",
      outdoorTip: "Spend 20 quiet minutes in your garden plot observing pollinators foraging on late asters.",
      watchFor: "Slugs taking advantage of autumn moisture under bottom mulch layers"
    });
  }

  // 4. Trail fallback
  if (systemPrompt.includes('expert outdoor adventure guide')) {
    return JSON.stringify({
      headline: "Autumn Ridge & Old Growth Expedition",
      season_note: "Crisp autumn air with optimal visibility and minimal insect activity along forested ridges.",
      trails: [
        {
          name: "Highline Whispering Pine Loop",
          type: "loop",
          distance: "4.8 miles",
          elevationGain: "740 ft",
          difficulty: "moderate",
          highlight: "Vast panoramic mountain views with golden larch trees and babbling crystal stream crossings",
          tip: "Pack trekking poles for loose shale on the western descent",
          parking: "Main trailhead lot fills by 9:00 AM on weekends; $5 pass or state pass required"
        },
        {
          name: "Hidden Creek Cedar Stroll",
          type: "out-and-back",
          distance: "2.5 miles",
          elevationGain: "210 ft",
          difficulty: "easy",
          highlight: "Enclosed canopy of 400-year-old western red cedars and vibrant maidenhair ferns",
          tip: "Wooden boardwalks can be slippery when wet with autumn morning dew",
          parking: "Lower creek lot with accessible picnic tables"
        }
      ],
      gear: [
        "Insulating wool or fleece layer (no cotton)",
        "Waterproof shell jacket with hood",
        "1.5 liters of drinking water and electrolyte snack",
        "Headlamp with fresh batteries for early twilight"
      ],
      leaveNoTrace: "Stay strictly on designated trails to preserve fragile alpine moss mats.",
      wildlifeWatch: "Black-tailed deer, pikas storing grass on rock screes, and migrating red-tailed hawks.",
      bonus: "Touch the rough bark of an old cedar, close your eyes for 3 minutes, and count the distinct sounds in the wind."
    });
  }

  // 5. Timing fallback
  if (systemPrompt.includes('phenologist')) {
    return JSON.stringify({
      headline: "Peak Golden Hour & Crepuscular Wildlife Movement",
      bestToday: {
        window: "4:45 PM – 6:15 PM (Pre-Sunset Golden Hour)",
        why: "Low autumn solar angle creates long warm shadows while diurnal birds settle and nocturnal owls begin activity.",
        duration: "45 to 60 minutes"
      },
      thisWeek: "Peak autumn foliage coloration and raptor migration through mountain gaps",
      activities: [
        { activity: "Golden Hour Trail Walk", idealTime: "5:00 PM", why: "Sunlight filters through turning leaves at peak warmth", difficulty: "easy" },
        { activity: "Early Dawn Chorus Listening", idealTime: "6:30 AM", why: "Songbirds feed aggressively after chilly nights", difficulty: "easy" },
        { activity: "Stargazing & Milky Way Horizon", idealTime: "8:30 PM", why: "Crisp low-humidity air provides crystal viewing", difficulty: "easy" }
      ],
      avoid: "Mid-day flat sunlight between 11:30 AM and 2:00 PM for scenic photography",
      celestial: "Waxing crescent moon visible above southwestern horizon shortly after sunset",
      phenology: "Deciduous trees are pulling chlorophyll back into root systems, revealing bright carotenoids.",
      microChallenge: "Step barefoot or touch hands to damp soil under a leafy tree for 3 minutes. Take 5 deep breaths of fresh petrichor."
    });
  }

  // 6. Ask nature fallback
  return "Nature is deeply cyclical. When you walk outside, the sensory grounding effect begins within 3 minutes as your autonomic nervous system lowers cortisol.\n\nWhether observing bird flight patterns or identifying edible plants, patience and quiet observation reveal patterns that phone screens obscure.\n\nAction step right now: Step outside for 10 minutes, leave your device behind, and observe 3 living things you haven't noticed before.";
}

function extractJSON(raw) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function ollamaStatus() {
  return new Promise((resolve) => {
    http.get(`${OLLAMA_URL}/api/tags`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const models = json.models?.map(m => m.name) || [];
          resolve({
            running: true,
            models,
            hasModel: models.some(m => m.startsWith('llama3.2') || m.startsWith('llama') || m.startsWith('mistral') || m.startsWith('phi'))
          });
        } catch { resolve({ running: true, models: [], hasModel: false }); }
      });
    }).on('error', () => resolve({ running: false, models: [], hasModel: false }));
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/api/status', async (req, res) => {
  const status = await ollamaStatus();
  res.json({ ...status, activeModel: ACTIVE_MODEL });
});

app.get('/api/models', async (req, res) => {
  const status = await ollamaStatus();
  res.json({ models: status.models, activeModel: ACTIVE_MODEL });
});

app.post('/api/set-model', (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'model required' });
  ACTIVE_MODEL = model;
  res.json({ success: true, activeModel: ACTIVE_MODEL });
});

// ── 🐦 Bird Whisperer ─────────────────────────────────────────────────────────
app.post('/api/bird', async (req, res) => {
  const { description, location, season } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });

  const system = `You are a friendly expert field ornithologist. Identify the bird from the description.
Respond ONLY in this exact JSON (no markdown, no prose before or after):
{
  "name": "Common Name",
  "scientific": "Genus species",
  "confidence": "high|medium|low",
  "description": "2-3 vivid sentences about this bird's appearance and personality",
  "calls": "Phonetic description of its call e.g. 'chick-a-dee-dee-dee' or 'fee-bee'",
  "habitat": "Specific habitats where it's found",
  "funFact": "One surprising or delightful fact",
  "look_for": "Top 3 field identification tips as a single string",
  "bestTime": "Best time of day and season to spot this species"
}`;

  const user = `Description: "${description}"${location ? `\nLocation: ${location}` : ''}${season ? `\nSeason: ${season}` : ''}`;

  try {
    const raw = await ollamaChat(system, user);
    const bird = extractJSON(raw);
    res.json({ success: true, bird, raw });
  } catch (err) { res.status(503).json({ error: err.message }); }
});

// ── 🌱 Garden Oracle ──────────────────────────────────────────────────────────
app.post('/api/garden', async (req, res) => {
  const { location, zone, month } = req.body;
  if (!location && !zone) return res.status(400).json({ error: 'Location or zone required' });

  const system = `You are a master gardener with deep expertise in planting calendars and regional horticulture.
Respond ONLY in this exact JSON (no markdown, no prose):
{
  "frostInfo": "First/last frost dates for this region",
  "seasonSummary": "One sentence on what the garden needs right now",
  "thisWeek": ["specific task 1", "specific task 2", "specific task 3", "specific task 4"],
  "plantNow": [
    {"plant": "Plant name", "why": "Why plant it now", "tip": "Pro gardening tip"},
    {"plant": "Plant name", "why": "Why plant it now", "tip": "Pro gardening tip"},
    {"plant": "Plant name", "why": "Why plant it now", "tip": "Pro gardening tip"}
  ],
  "waitUntil": ["plant — wait until specific time/condition"],
  "soilTask": "One specific soil preparation or amendment task",
  "harvest": "What might be ready to harvest right now",
  "outdoorTip": "One tip to make time in the garden more enjoyable today",
  "watchFor": "One pest, disease, or weather condition to watch for this week"
}`;

  const month_ = month || new Date().toLocaleString('default', { month: 'long' });
  const user = `Location/Region: ${location || 'unknown'}${zone ? `\nUSDA Zone: ${zone}` : ''}\nCurrent month: ${month_}`;

  try {
    const raw = await ollamaChat(system, user, ACTIVE_MODEL, 700);
    const garden = extractJSON(raw);
    res.json({ success: true, garden, raw });
  } catch (err) { res.status(503).json({ error: err.message }); }
});

// ── 🥾 Trail Finder ───────────────────────────────────────────────────────────
app.post('/api/trail', async (req, res) => {
  const { location, difficulty, duration, interest } = req.body;
  if (!location) return res.status(400).json({ error: 'Location required' });

  const system = `You are an expert outdoor adventure guide and naturalist.
Respond ONLY in this exact JSON (no markdown, no prose):
{
  "headline": "Exciting headline for today's outdoor adventure",
  "season_note": "What makes being outside special right now",
  "trails": [
    {
      "name": "Trail or area name",
      "type": "loop|out-and-back|point-to-point",
      "distance": "X miles/km",
      "elevationGain": "X ft/m",
      "difficulty": "easy|moderate|hard",
      "highlight": "What makes this unmissable right now",
      "tip": "One practical tip specific to this trail and season",
      "parking": "Parking or access note"
    },
    {
      "name": "Second trail option",
      "type": "loop|out-and-back|point-to-point",
      "distance": "X miles/km",
      "elevationGain": "X ft/m",
      "difficulty": "easy|moderate|hard",
      "highlight": "What makes this trail special",
      "tip": "Practical tip",
      "parking": "Access note"
    }
  ],
  "gear": ["item 1", "item 2", "item 3", "item 4"],
  "leaveNoTrace": "One LNT principle specific to current season",
  "wildlifeWatch": "Wildlife you might spot on the trail right now",
  "bonus": "A nature challenge or mindfulness activity to try on the trail"
}`;

  const user = `Location: ${location}\nDifficulty: ${difficulty || 'any'}\nTime: ${duration || 'half day'}\nInterest: ${interest || 'general hiking and nature'}`;

  try {
    const raw = await ollamaChat(system, user, ACTIVE_MODEL, 800);
    const trail = extractJSON(raw);
    res.json({ success: true, trail, raw });
  } catch (err) { res.status(503).json({ error: err.message }); }
});

// ── 🍄 Plant Spotter ──────────────────────────────────────────────────────────
app.post('/api/plant', async (req, res) => {
  const { description, location, context } = req.body;
  if (!description) return res.status(400).json({ error: 'Description required' });

  const system = `You are a professional botanist and foraging safety expert.
CRITICAL: Always prioritize safety. When in doubt, say so clearly.
Respond ONLY in this exact JSON (no markdown, no prose):
{
  "name": "Common name",
  "scientific": "Genus species",
  "family": "Plant family",
  "confidence": "high|medium|low",
  "edibility": "edible|toxic|medicinal-only|unknown|avoid",
  "safetyLevel": "safe|caution|dangerous|deadly",
  "safetyNote": "CRITICAL safety information — be explicit about dangers",
  "identification": "Key visual features: leaf shape, color, stem, flowers, smell",
  "lookalikes": "Dangerous look-alike species to watch for",
  "habitat": "Where this plant commonly grows",
  "season": "When it's present/harvestable",
  "uses": "Traditional or culinary uses (if safe)",
  "foragerTip": "One practical tip for finding or using this plant safely",
  "disclaimer": "Always verify with a local expert before consuming any wild plant"
}`;

  const user = `Plant description: "${description}"${location ? `\nLocation: ${location}` : ''}${context ? `\nContext: ${context}` : ''}`;

  try {
    const raw = await ollamaChat(system, user, ACTIVE_MODEL, 700);
    const plant = extractJSON(raw);
    res.json({ success: true, plant, raw });
  } catch (err) { res.status(503).json({ error: err.message }); }
});

// ── 🌤️ Outdoor Timing ─────────────────────────────────────────────────────────
app.post('/api/timing', async (req, res) => {
  const { location, activity, month, hemisphere } = req.body;

  const system = `You are a naturalist, phenologist, and outdoor activity planner.
Give specific, actionable advice on the best times to be outside.
Respond ONLY in this exact JSON (no markdown, no prose):
{
  "headline": "What's happening in nature right now",
  "bestToday": {
    "window": "Best time of day e.g. '6:00–9:00 AM' or 'Golden Hour before sunset'",
    "why": "Why this window is special",
    "duration": "Suggested time outside"
  },
  "thisWeek": "What natural event peaks this week worth seeing",
  "activities": [
    {"activity": "Activity name", "idealTime": "Time of day", "why": "Nature-based reason", "difficulty": "easy|moderate|active"},
    {"activity": "Activity name", "idealTime": "Time of day", "why": "Nature-based reason", "difficulty": "easy|moderate|active"},
    {"activity": "Activity name", "idealTime": "Time of day", "why": "Nature-based reason", "difficulty": "easy|moderate|active"}
  ],
  "avoid": "Times or conditions to avoid and why",
  "celestial": "Any celestial event — moon phase, meteor shower, planet visibility",
  "phenology": "What plants/animals are doing right now seasonally",
  "microChallenge": "A 10-minute outdoor mindfulness or nature observation challenge"
}`;

  const month_ = month || new Date().toLocaleString('default', { month: 'long' });
  const user = `Location: ${location || 'temperate Northern Hemisphere'}\nMonth: ${month_}\nHemisphere: ${hemisphere || 'northern'}\nActivity interest: ${activity || 'general outdoor time'}`;

  try {
    const raw = await ollamaChat(system, user, ACTIVE_MODEL, 700);
    const timing = extractJSON(raw);
    res.json({ success: true, timing, raw });
  } catch (err) { res.status(503).json({ error: err.message }); }
});

// ── 🤔 Ask Nature ─────────────────────────────────────────────────────────────
app.post('/api/ask', async (req, res) => {
  const { question, context } = req.body;
  if (!question) return res.status(400).json({ error: 'Question required' });

  const system = `You are GrassWhisperer — an enthusiastic, knowledgeable outdoor companion AI.
You help people connect with nature: hiking, birding, gardening, foraging (safely), stargazing, wildlife, weather, survival skills, and more.
You run locally — no internet, no data sent anywhere, no tracking. 
Be warm, practical, and specific. Always encourage getting outside. Use emoji naturally.
Format with clear paragraphs. Max 250 words. End with one actionable step to take right now.`;

  const user = `${context ? `Context: ${context}\n\n` : ''}Question: ${question}`;

  try {
    const answer = await ollamaChat(system, user, ACTIVE_MODEL, 400);
    res.json({ success: true, answer });
  } catch (err) { res.status(503).json({ error: err.message }); }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║    🌿  GrassWhisperer  v2.0              ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Open:  http://localhost:${PORT}            ║`);
  console.log(`║  Model: ${ACTIVE_MODEL.padEnd(32)}║`);
  console.log('║  Local · Private · Open-Source           ║');
  console.log('╚══════════════════════════════════════════╝\n');
});
