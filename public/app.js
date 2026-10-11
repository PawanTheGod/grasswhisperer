/**
 * GrassWhisperer 🌿 — Product Engine v2.0
 * 100% Offline-First AI Client Architecture
 * Features: 6 AI pipelines, Web Speech TTS, Geolocation, Field Journal, Model Switcher
 */

'use strict';

// ── State Management ─────────────────────────────────────────────────────────
const STATE = {
  activeTab: 'bird',
  location: '',
  journal: JSON.parse(localStorage.getItem('gw_journal') || '[]'),
  speechEnabled: true,
  activeModel: 'llama3.2:1b'
};

// ── Initialization ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStatus();
  updateJournalCount();
  setupSpeechToggle();
});

// ── Tab Navigation ───────────────────────────────────────────────────────────
function switchTab(tabId) {
  STATE.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${tabId}`);
  });

  const pane = document.getElementById(`pane-${tabId}`);
  if (pane && window.scrollY > 300) {
    pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function fillInput(elemId, value) {
  const el = document.getElementById(elemId);
  if (el) {
    el.value = value;
    el.focus();
    toast(`Preset loaded into ${el.previousElementSibling?.innerText || 'field'}`);
  }
}

// ── System Status & Model Control ────────────────────────────────────────────
async function initStatus() {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');

  try {
    const res = await fetch('/api/status');
    const data = await res.json();

    if (data.running && data.hasModel) {
      dot.className = 'status-pulse';
      STATE.activeModel = data.activeModel || 'llama3.2:1b';
      txt.textContent = `Local AI Active · ${STATE.activeModel} ready`;
      populateModelOptions(data.models || [], STATE.activeModel);
    } else if (data.running) {
      dot.className = 'status-pulse warn';
      txt.textContent = `Ollama running · Model missing (run: ollama pull llama3.2:1b)`;
    } else {
      dot.className = 'status-pulse error';
      txt.textContent = `Local AI Node Offline · Start Ollama (ollama serve)`;
    }
  } catch (err) {
    dot.className = 'status-pulse error';
    txt.textContent = `Local Node Unreachable · Check server`;
  }
}

function populateModelOptions(models, current) {
  const sel = document.getElementById('modelSelect');
  if (!sel || !models.length) return;

  sel.innerHTML = '';
  models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m + (m === current ? ' (Active)' : '');
    opt.selected = m === current;
    sel.appendChild(opt);
  });
}

async function changeModel(modelName) {
  try {
    const res = await fetch('/api/set-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName })
    });
    const data = await res.json();
    if (data.success) {
      STATE.activeModel = modelName;
      toast(`Switched active model to ${modelName}`);
      initStatus();
    }
  } catch (err) {
    toast(`Failed to switch model: ${err.message}`, true);
  }
}

async function refreshModels() {
  toast('Checking local models…');
  await initStatus();
}

// ── Geolocation Auto-Detection ───────────────────────────────────────────────
function detectLocation() {
  const lbl = document.getElementById('locLabel');
  if (!navigator.geolocation) {
    toast('Geolocation not supported by this browser', true);
    return;
  }

  lbl.textContent = 'Locating…';

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      let locName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°W`;

      try {
        // Reverse geocode with public OSM nominatim or fallback
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        if (data.address) {
          locName = data.address.city || data.address.town || data.address.county || data.address.state || locName;
          if (data.address.state) locName += `, ${data.address.state}`;
        }
      } catch {
        // Network offline fallback
      }

      STATE.location = locName;
      lbl.textContent = locName;
      toast(`Location set: ${locName}`);

      // Auto-populate relevant inputs
      ['birdLoc', 'plantLoc', 'gardenLoc', 'trailLoc', 'timingLoc'].forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value) input.value = locName;
      });
    },
    (err) => {
      lbl.textContent = 'Detect Location';
      toast(`Location access: ${err.message}`, true);
    },
    { timeout: 7000 }
  );
}

// ── Speech Synthesis (TTS) ───────────────────────────────────────────────────
function setupSpeechToggle() {
  const toggle = document.getElementById('ttsToggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      STATE.speechEnabled = e.target.checked;
    });
  }
}

function speakText(text) {
  if (!STATE.speechEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ── Field Journal ────────────────────────────────────────────────────────────
function toggleJournal(show = true) {
  const drawer = document.getElementById('journalDrawer');
  const overlay = document.getElementById('journalOverlay');
  const isOpen = drawer.classList.contains('active');
  const next = show === undefined ? !isOpen : show;

  drawer.classList.toggle('active', next);
  overlay.classList.toggle('active', next);
  if (next) renderJournalList();
}

function toggleSettings(show = true) {
  const drawer = document.getElementById('settingsDrawer');
  const overlay = document.getElementById('settingsOverlay');
  const isOpen = drawer.classList.contains('active');
  const next = show === undefined ? !isOpen : show;

  drawer.classList.toggle('active', next);
  overlay.classList.toggle('active', next);
}

function saveToJournal(title, subtitle, type, details) {
  const entry = {
    id: Date.now(),
    title,
    subtitle,
    type,
    details,
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  };

  STATE.journal.unshift(entry);
  localStorage.setItem('gw_journal', JSON.stringify(STATE.journal));
  updateJournalCount();
  toast(`Saved "${title}" to your Field Journal!`);
}

function updateJournalCount() {
  const el = document.getElementById('journalCount');
  if (el) el.textContent = STATE.journal.length;
}

function renderJournalList() {
  const list = document.getElementById('journalItemsList');
  if (!STATE.journal.length) {
    list.innerHTML = `<div class="empty-state small"><p>No saved entries yet. Click "Save" on any observation result.</p></div>`;
    return;
  }

  list.innerHTML = STATE.journal.map(item => `
    <div class="journal-item">
      <div class="journal-item-head">
        <strong>${escapeHtml(item.title)}</strong>
        <span class="journal-item-time">${item.date}</span>
      </div>
      <p><em>${escapeHtml(item.subtitle || item.type)}</em></p>
      <button class="action-btn small danger" onclick="deleteJournalItem(${item.id})">Remove</button>
    </div>
  `).join('');
}

function deleteJournalItem(id) {
  STATE.journal = STATE.journal.filter(i => i.id !== id);
  localStorage.setItem('gw_journal', JSON.stringify(STATE.journal));
  updateJournalCount();
  renderJournalList();
  toast('Item removed from journal');
}

function clearJournal() {
  if (!confirm('Clear all journal records?')) return;
  STATE.journal = [];
  localStorage.removeItem('gw_journal');
  updateJournalCount();
  renderJournalList();
  toast('Field journal cleared');
}

function exportJournalMarkdown() {
  if (!STATE.journal.length) {
    toast('No journal entries to export', true);
    return;
  }

  let md = `# GrassWhisperer 🌿 Offline Field Journal\n*Generated on ${new Date().toLocaleString()}*\n\n`;
  STATE.journal.forEach((j, idx) => {
    md += `## ${idx + 1}. ${j.title} (${j.type})\n`;
    md += `*Logged on: ${j.date}*\n`;
    if (j.subtitle) md += `*Classification:* ${j.subtitle}\n\n`;
    md += `\`\`\`json\n${JSON.stringify(j.details, null, 2)}\n\`\`\`\n\n---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grasswhisperer-journal-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Downloaded Field Journal Markdown file');
}

// ── UI Helpers ───────────────────────────────────────────────────────────────
function setLoading(containerId, btnId, title) {
  const box = document.getElementById(containerId);
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = true;

  box.innerHTML = `
    <div class="loading-box">
      <div class="spinner-leaf"></div>
      <h4>${title}</h4>
      <p>Running local inference on ${STATE.activeModel} (Zero internet required)…</p>
    </div>
  `;
}

function resetBtn(btnId) {
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = false;
}

function toast(msg, isError = false) {
  const hub = document.getElementById('toastHub');
  const t = document.createElement('div');
  t.className = `toast ${isError ? 'toast-error' : ''}`;
  t.innerHTML = `<span>${isError ? '⚠️' : '🌿'}</span> <span>${escapeHtml(msg)}</span>`;
  hub.appendChild(t);

  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(8px)';
    setTimeout(() => t.remove(), 250);
  }, 3500);
}

function copyToClipboard(text, notice = 'Copied to clipboard!') {
  navigator.clipboard.writeText(text).then(() => toast(notice));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── 1. BIRD WHISPERER ────────────────────────────────────────────────────────
async function identifyBird(e) {
  e.preventDefault();
  const desc = document.getElementById('birdDesc').value.trim();
  const loc = document.getElementById('birdLoc').value.trim();
  const season = document.getElementById('birdSeason').value;

  setLoading('birdResult', 'btnBirdSubmit', 'Listening to bird field notes…');

  try {
    const res = await fetch('/api/bird', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, location: loc, season })
    });
    const data = await res.json();
    resetBtn('btnBirdSubmit');

    if (!data.success || !data.bird) {
      renderRawOutput('birdResult', data.raw || 'No structured observation found.');
      return;
    }

    const b = data.bird;
    const confBadge = `badge-confidence-${(b.confidence || 'medium').toLowerCase()}`;

    document.getElementById('birdResult').innerHTML = `
      <div class="result-header">
        <div class="result-title-group">
          <h3>${escapeHtml(b.name || 'Identified Species')}</h3>
          <span class="scientific">${escapeHtml(b.scientific || '')}</span>
        </div>
        <div class="result-actions">
          <span class="badge ${confBadge}">${escapeHtml(b.confidence || 'Medium')} Match</span>
          <button class="icon-btn" title="Save to Journal" onclick='saveToJournal("${escapeHtml(b.name)}", "${escapeHtml(b.scientific)}", "Bird", ${JSON.stringify(b)})'>🔖</button>
          <button class="icon-btn" title="Copy Info" onclick='copyToClipboard("${escapeHtml(b.name)} (${escapeHtml(b.scientific)}): ${escapeHtml(b.description)}")'>📋</button>
        </div>
      </div>

      ${b.calls ? `
        <div class="audio-play-bar">
          <span class="audio-label">🔊 Call Phonetics: <em>"${escapeHtml(b.calls)}"</em></span>
          <button class="audio-btn" onclick='speakText("${escapeHtml(b.calls)}")'>▶ Listen Synthesized</button>
        </div>
      ` : ''}

      <div class="highlight-box">
        <strong>Field Description:</strong> ${escapeHtml(b.description || '')}
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Habitat</span>
          <span class="meta-val">${escapeHtml(b.habitat || 'Forest & Wooded Edges')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Peak Observation</span>
          <span class="meta-val">${escapeHtml(b.bestTime || 'Morning Dawn Chorus')}</span>
        </div>
      </div>

      <div class="meta-item" style="margin-bottom:12px;">
        <span class="meta-label">Top Field ID Tips</span>
        <span class="meta-val">${escapeHtml(b.look_for || '')}</span>
      </div>

      ${b.funFact ? `
        <div class="meta-item">
          <span class="meta-label">Naturalist Lore</span>
          <span class="meta-val">${escapeHtml(b.funFact)}</span>
        </div>
      ` : ''}
    `;

    toast(`Identified ${b.name}!`);
  } catch (err) {
    resetBtn('btnBirdSubmit');
    renderError('birdResult', err.message);
  }
}

// ── 2. PLANT SPOTTER ─────────────────────────────────────────────────────────
async function identifyPlant(e) {
  e.preventDefault();
  const desc = document.getElementById('plantDesc').value.trim();
  const loc = document.getElementById('plantLoc').value.trim();
  const goal = document.getElementById('plantGoal').value;

  setLoading('plantResult', 'btnPlantSubmit', 'Analyzing botanical taxonomy & toxicity…');

  try {
    const res = await fetch('/api/plant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: desc, location: loc, context: goal })
    });
    const data = await res.json();
    resetBtn('btnPlantSubmit');

    if (!data.success || !data.plant) {
      renderRawOutput('plantResult', data.raw || 'No structured botanical data.');
      return;
    }

    const p = data.plant;
    const safetyBadge = `badge-${(p.safetyLevel || 'caution').toLowerCase()}`;

    document.getElementById('plantResult').innerHTML = `
      <div class="result-header">
        <div class="result-title-group">
          <h3>${escapeHtml(p.name || 'Botanical Specimen')}</h3>
          <span class="scientific">${escapeHtml(p.scientific || '')} ${p.family ? `· Family: ${escapeHtml(p.family)}` : ''}</span>
        </div>
        <div class="result-actions">
          <span class="badge ${safetyBadge}">${escapeHtml(p.safetyLevel || 'Caution')}</span>
          <button class="icon-btn" title="Save to Journal" onclick='saveToJournal("${escapeHtml(p.name)}", "${escapeHtml(p.scientific)}", "Plant", ${JSON.stringify(p)})'>🔖</button>
          <button class="icon-btn" title="Copy Info" onclick='copyToClipboard("${escapeHtml(p.name)}: ${escapeHtml(p.identification)}")'>📋</button>
        </div>
      </div>

      ${p.safetyNote ? `
        <div class="danger-banner">
          <span>⚠️</span>
          <div>
            <strong>Safety Directive:</strong> ${escapeHtml(p.safetyNote)}
          </div>
        </div>
      ` : ''}

      <div class="highlight-box">
        <strong>Botanical Identification Keys:</strong><br />
        ${escapeHtml(p.identification || '')}
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Edibility Status</span>
          <span class="meta-val">${escapeHtml(p.edibility || 'Unknown')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Habitat & Growth</span>
          <span class="meta-val">${escapeHtml(p.habitat || 'Soil / Woodlands')}</span>
        </div>
      </div>

      ${p.lookalikes ? `
        <div class="meta-item" style="margin-bottom:12px; border-left: 3px solid #ef4444;">
          <span class="meta-label" style="color:#f87171;">Dangerous Look-Alikes</span>
          <span class="meta-val">${escapeHtml(p.lookalikes)}</span>
        </div>
      ` : ''}

      ${p.foragerTip ? `
        <div class="meta-item" style="margin-bottom:12px;">
          <span class="meta-label">Forager's Practice</span>
          <span class="meta-val">${escapeHtml(p.foragerTip)}</span>
        </div>
      ` : ''}

      <p style="font-size:0.75rem; color:#86efac; opacity:0.8; margin-top:8px;">
        ⚖️ <em>Disclaimer: ${escapeHtml(p.disclaimer || 'Always verify with certified local field botanists before consuming wild flora.')}</em>
      </p>
    `;

    toast(`Botanical keys compiled for ${p.name}`);
  } catch (err) {
    resetBtn('btnPlantSubmit');
    renderError('plantResult', err.message);
  }
}

// ── 3. GARDEN ORACLE ─────────────────────────────────────────────────────────
async function planGarden(e) {
  e.preventDefault();
  const loc = document.getElementById('gardenLoc').value.trim();
  const zone = document.getElementById('gardenZone').value;
  const month = document.getElementById('gardenMonth').value;

  setLoading('gardenResult', 'btnGardenSubmit', 'Consulting horticultural calendar…');

  try {
    const res = await fetch('/api/garden', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: loc, zone, month })
    });
    const data = await res.json();
    resetBtn('btnGardenSubmit');

    if (!data.success || !data.garden) {
      renderRawOutput('gardenResult', data.raw || 'No garden plan.');
      return;
    }

    const g = data.garden;

    document.getElementById('gardenResult').innerHTML = `
      <div class="result-header">
        <div class="result-title-group">
          <h3>Garden Prescription</h3>
          <span class="scientific">${escapeHtml(loc)} · ${escapeHtml(month || 'Current Cycle')}</span>
        </div>
        <div class="result-actions">
          <button class="icon-btn" title="Save to Journal" onclick='saveToJournal("Garden Plan - ${escapeHtml(loc)}", "${escapeHtml(month)}", "Garden", ${JSON.stringify(g)})'>🔖</button>
        </div>
      </div>

      <div class="highlight-box">
        <strong>Seasonal Briefing:</strong> ${escapeHtml(g.seasonSummary || '')}<br />
        <small style="color:#86efac;">Frost Calendar: ${escapeHtml(g.frostInfo || 'Check local extension service')}</small>
      </div>

      <div class="meta-item" style="margin-bottom:14px;">
        <span class="meta-label">What to Plant Right Now</span>
        <div style="margin-top:6px; display:flex; flex-direction:column; gap:6px;">
          ${(g.plantNow || []).map(p => `
            <div style="background:rgba(255,255,255,0.04); padding:8px 10px; border-radius:6px;">
              <strong style="color:#ffffff;">🌿 ${escapeHtml(typeof p === 'object' ? p.plant : p)}</strong>
              ${p.why ? ` — <span style="font-size:0.84rem; color:#a7f3d0;">${escapeHtml(p.why)}</span>` : ''}
              ${p.tip ? `<br /><small style="color:#86efac;">Tip: ${escapeHtml(p.tip)}</small>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="meta-item" style="margin-bottom:14px;">
        <span class="meta-label">This Week's Garden Checklist</span>
        <ul class="checklist">
          ${(g.thisWeek || []).map(t => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Soil & Composting</span>
          <span class="meta-val">${escapeHtml(g.soilTask || 'Aerate and mulch beds')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Pest / Weather Alert</span>
          <span class="meta-val">${escapeHtml(g.watchFor || 'Monitor moisture')}</span>
        </div>
      </div>

      ${g.outdoorTip ? `
        <div class="meta-item">
          <span class="meta-label">Mindful Outdoor Habit</span>
          <span class="meta-val">${escapeHtml(g.outdoorTip)}</span>
        </div>
      ` : ''}
    `;

    toast('Horticultural guide prepared!');
  } catch (err) {
    resetBtn('btnGardenSubmit');
    renderError('gardenResult', err.message);
  }
}

// ── 4. TRAIL FINDER ──────────────────────────────────────────────────────────
async function findTrails(e) {
  e.preventDefault();
  const loc = document.getElementById('trailLoc').value.trim();
  const diff = document.getElementById('trailDiff').value;
  const dur = document.getElementById('trailDuration').value;
  const interest = document.getElementById('trailInterest').value.trim();

  setLoading('trailResult', 'btnTrailSubmit', 'Mapping backcountry routes & elevation profiles…');

  try {
    const res = await fetch('/api/trail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: loc, difficulty: diff, duration: dur, interest })
    });
    const data = await res.json();
    resetBtn('btnTrailSubmit');

    if (!data.success || !data.trail) {
      renderRawOutput('trailResult', data.raw || 'No trail itineraries.');
      return;
    }

    const t = data.trail;

    document.getElementById('trailResult').innerHTML = `
      <div class="result-header">
        <div class="result-title-group">
          <h3>${escapeHtml(t.headline || 'Trek Itinerary')}</h3>
          <span class="scientific">${escapeHtml(loc)} · ${escapeHtml(diff)}</span>
        </div>
        <div class="result-actions">
          <button class="icon-btn" title="Save to Journal" onclick='saveToJournal("${escapeHtml(t.headline)}", "${escapeHtml(loc)}", "Trail", ${JSON.stringify(t)})'>🔖</button>
        </div>
      </div>

      ${t.season_note ? `
        <div class="highlight-box">
          <strong>Season Conditions:</strong> ${escapeHtml(t.season_note)}
        </div>
      ` : ''}

      ${(t.trails || []).map(trail => `
        <div class="trail-subcard">
          <div class="trail-subcard-header">
            <h4>🥾 ${escapeHtml(trail.name)}</h4>
            <span class="badge" style="background:#0284c7; color:#ffffff;">${escapeHtml(trail.difficulty || 'Moderate')}</span>
          </div>
          <div class="trail-specs">
            <span>📏 ${escapeHtml(trail.distance || 'Varies')}</span>
            <span>⛰️ ${escapeHtml(trail.elevationGain || 'Gradual')}</span>
            <span>🔄 ${escapeHtml(trail.type || 'Loop')}</span>
          </div>
          <p style="font-size:0.88rem; color:#ffffff; margin-bottom:6px;">${escapeHtml(trail.highlight || '')}</p>
          ${trail.tip ? `<p style="font-size:0.8rem; color:#86efac;"><strong>Pro-Tip:</strong> ${escapeHtml(trail.tip)}</p>` : ''}
        </div>
      `).join('')}

      <div class="meta-item" style="margin-bottom:12px;">
        <span class="meta-label">Essential Trail Pack List</span>
        <ul class="checklist">
          ${(t.gear || []).map(g => `<li>${escapeHtml(g)}</li>`).join('')}
        </ul>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Leave No Trace Principle</span>
          <span class="meta-val">${escapeHtml(t.leaveNoTrace || 'Pack it in, pack it out')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Wildlife to Respect</span>
          <span class="meta-val">${escapeHtml(t.wildlifeWatch || 'Observe from distance')}</span>
        </div>
      </div>

      ${t.bonus ? `
        <div class="meta-item">
          <span class="meta-label">Trail Challenge</span>
          <span class="meta-val">${escapeHtml(t.bonus)}</span>
        </div>
      ` : ''}
    `;

    toast('Trail adventures generated!');
  } catch (err) {
    resetBtn('btnTrailSubmit');
    renderError('trailResult', err.message);
  }
}

// ── 5. OUTDOOR TIMING ────────────────────────────────────────────────────────
async function calculateTiming(e) {
  e.preventDefault();
  const loc = document.getElementById('timingLoc').value.trim();
  const act = document.getElementById('timingActivity').value;
  const hemi = document.getElementById('timingHemisphere').value;

  setLoading('timingResult', 'btnTimingSubmit', 'Calculating solar elevation, wildlife peaks, & celestial windows…');

  try {
    const res = await fetch('/api/timing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: loc, activity: act, hemisphere: hemi })
    });
    const data = await res.json();
    resetBtn('btnTimingSubmit');

    if (!data.success || !data.timing) {
      renderRawOutput('timingResult', data.raw || 'No timing calculations.');
      return;
    }

    const tm = data.timing;

    document.getElementById('timingResult').innerHTML = `
      <div class="result-header">
        <div class="result-title-group">
          <h3>${escapeHtml(tm.headline || 'Optimal Outdoor Window')}</h3>
          <span class="scientific">${escapeHtml(loc)} · ${escapeHtml(act)}</span>
        </div>
        <div class="result-actions">
          <button class="icon-btn" title="Save to Journal" onclick='saveToJournal("Timing - ${escapeHtml(loc)}", "${escapeHtml(act)}", "Timing", ${JSON.stringify(tm)})'>🔖</button>
        </div>
      </div>

      ${tm.bestToday ? `
        <div class="highlight-box" style="border-color: #ca8a04; background: rgba(202, 138, 4, 0.1);">
          <strong style="font-size:1.05rem; color:#fde047;">☀️ Prime Window Today: ${escapeHtml(tm.bestToday.window || 'Golden Hour')}</strong>
          <p style="margin-top:4px; font-size:0.88rem;">${escapeHtml(tm.bestToday.why || '')}</p>
          <small style="color:#fef08a;">Suggested outing length: ${escapeHtml(tm.bestToday.duration || '45 minutes')}</small>
        </div>
      ` : ''}

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Phenology (Nature Rhythm)</span>
          <span class="meta-val">${escapeHtml(tm.phenology || 'Seasonal migrations and flowering')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Celestial & Night Sky</span>
          <span class="meta-val">${escapeHtml(tm.celestial || 'Clear horizon viewing')}</span>
        </div>
      </div>

      <div class="meta-item" style="margin-bottom:12px;">
        <span class="meta-label">Curated Activities For This Season</span>
        <div style="margin-top:6px; display:flex; flex-direction:column; gap:6px;">
          ${(tm.activities || []).map(a => `
            <div style="background:rgba(255,255,255,0.04); padding:8px 10px; border-radius:6px;">
              <strong style="color:#ffffff;">🌿 ${escapeHtml(a.activity)}</strong> — <span style="color:#fde047;">${escapeHtml(a.idealTime)}</span>
              <p style="font-size:0.82rem; color:#a7f3d0; margin-top:2px;">${escapeHtml(a.why)}</p>
            </div>
          `).join('')}
        </div>
      </div>

      ${tm.microChallenge ? `
        <div class="highlight-box" style="background:rgba(16, 185, 129, 0.12); border-color:#22c55e;">
          <strong style="color:#86efac;">🎯 10-Minute Touch Grass Micro Challenge:</strong>
          <p style="margin-top:4px; font-size:0.9rem;">${escapeHtml(tm.microChallenge)}</p>
        </div>
      ` : ''}

      ${tm.avoid ? `
        <div class="meta-item">
          <span class="meta-label" style="color:#f87171;">Avoidances / Conditions</span>
          <span class="meta-val">${escapeHtml(tm.avoid)}</span>
        </div>
      ` : ''}
    `;

    toast('Outdoor timing computed!');
  } catch (err) {
    resetBtn('btnTimingSubmit');
    renderError('timingResult', err.message);
  }
}

// ── 6. ASK NATURE ────────────────────────────────────────────────────────────
async function askNature(e) {
  e.preventDefault();
  const q = document.getElementById('askQuestion').value.trim();
  const ctx = document.getElementById('askContext').value.trim();

  setLoading('askResult', 'btnAskSubmit', 'Consulting natural history archives & bushcraft lore…');

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, context: ctx })
    });
    const data = await res.json();
    resetBtn('btnAskSubmit');

    if (!data.success || !data.answer) {
      renderRawOutput('askResult', data.raw || 'No answer available.');
      return;
    }

    const ans = data.answer;

    document.getElementById('askResult').innerHTML = `
      <div class="result-header">
        <div class="result-title-group">
          <h3>Naturalist Response</h3>
          <span class="scientific">"${escapeHtml(q)}"</span>
        </div>
        <div class="result-actions">
          <button class="icon-btn" title="Listen" onclick='speakText("${escapeHtml(ans.replace(/\n/g, ' '))}")'>🔊</button>
          <button class="icon-btn" title="Copy Answer" onclick='copyToClipboard("${escapeHtml(ans)}")'>📋</button>
          <button class="icon-btn" title="Save to Journal" onclick='saveToJournal("${escapeHtml(q)}", "Naturalist Q&A", "Q&A", { question: "${escapeHtml(q)}", answer: "${escapeHtml(ans)}" })'>🔖</button>
        </div>
      </div>

      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:12px; padding:18px; line-height:1.75; font-size:0.94rem; color:#f0fdf4;">
        ${escapeHtml(ans).replace(/\n\n/g, '<br /><br />').replace(/\n/g, '<br />')}
      </div>
    `;

    toast('Field naturalist answered!');
  } catch (err) {
    resetBtn('btnAskSubmit');
    renderError('askResult', err.message);
  }
}

// ── Fallbacks & Error Handlers ───────────────────────────────────────────────
function renderRawOutput(containerId, raw) {
  document.getElementById(containerId).innerHTML = `
    <div class="highlight-box">
      <strong>Observation Output:</strong><br />
      <pre style="font-family:var(--font-mono); font-size:0.82rem; white-space:pre-wrap; color:#a7f3d0; margin-top:8px;">${escapeHtml(raw)}</pre>
    </div>
  `;
}

function renderError(containerId, error) {
  document.getElementById(containerId).innerHTML = `
    <div class="danger-banner">
      <span>❌</span>
      <div>
        <strong>Local Engine Exception:</strong><br />
        ${escapeHtml(error)}<br />
        <small style="color:#fecaca;">Make sure Ollama is running (<code>ollama serve</code>) and model is pulled.</small>
      </div>
    </div>
  `;
  toast(`Error: ${error}`, true);
}
