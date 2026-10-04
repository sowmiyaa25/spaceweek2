// COSMIC INVESTIGATION · Space Week 2026 · Day 2 — vanilla JS, no dependencies
const gameState = { currentRound: 1, score: 0, startTime: null, completedRounds: [], attempts: {}, cluesUsed: {} };
let lang = 'both', ui = {}, rvTimer = null, endTime = null;
const $ = s => document.querySelector(s), app = $('#app');
const bi = (e, t) => `<span class="bi"><span class="en">${e}</span><span class="ta">${t}</span></span>`;
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Visuals (inline SVG) ----------
const spec = sh => {
  const L = [55, 105, 165, 225];
  const bar = (y, s, t) => `<text x="0" y="${y - 6}" class="vt">${t}</text><rect x="0" y="${y}" width="300" height="34" rx="4" fill="url(#sg)"/>${L.map(x => `<rect x="${x + s}" y="${y}" width="3" height="34" fill="#000"/>`).join('')}`;
  return `<svg viewBox="0 0 300 140" class="vis"><defs><linearGradient id="sg"><stop offset="0" stop-color="#6a2cff"/><stop offset=".2" stop-color="#2a6bff"/><stop offset=".4" stop-color="#2fd05a"/><stop offset=".6" stop-color="#ffe14a"/><stop offset=".8" stop-color="#ff8a2a"/><stop offset="1" stop-color="#e01c1c"/></linearGradient></defs>${bar(22, 0, 'REFERENCE SPECTRUM · மூல நிறமாலை')}${bar(88, sh, 'OBSERVED SPECTRUM · கண்ட நிறமாலை')}<text x="0" y="136" class="vt">◀ shorter wavelength</text><text x="300" y="136" class="vt" text-anchor="end">longer wavelength ▶</text></svg>`;
};
const temp = () => `<svg viewBox="0 0 300 150" class="vis"><path class="draw" d="M20 128 C45 125 65 28 90 28 C120 28 150 105 285 122" fill="none" stroke="#5ee1ff" stroke-width="2.5"/><path class="draw" d="M20 130 C100 128 160 112 205 62 C225 42 245 62 285 108" fill="none" stroke="#ff8a6b" stroke-width="2.5"/><text x="100" y="24" class="vt" fill="#5ee1ff">STAR A</text><text x="214" y="56" class="vt">STAR B</text><line x1="20" y1="136" x2="285" y2="136" stroke="#9fb0d6"/><text x="20" y="147" class="vt">◀ shorter wavelength</text><text x="285" y="147" class="vt" text-anchor="end">longer wavelength ▶</text><text x="22" y="14" class="vt">INTENSITY ↑ · செறிவு</text></svg>`;
const transit = () => `<svg viewBox="0 0 300 130" class="vis"><path class="draw" d="M10 40 H55 L60 56 H80 L85 40 H145 L150 56 H170 L175 40 H235 L240 56 H260 L265 40 H290" fill="none" stroke="#5ee1ff" stroke-width="2.5"/><line x1="10" y1="100" x2="290" y2="100" stroke="#9fb0d6"/><text x="10" y="114" class="vt">TIME → · நேரம்</text><text x="10" y="14" class="vt">BRIGHTNESS ↑ · ஒளிர்வு</text></svg>`;
const dat = a => `<div class="dat">${a.map(([h, e, t]) => `<div><b>${h}</b>${bi(e, t)}</div>`).join('')}</div>`;
const orb = () => `<svg viewBox="0 0 100 100" class="orb"><defs><filter id="bl"><feGaussianBlur stdDeviation="2.5"/></filter></defs><g transform="rotate(-25 50 50)" filter="url(#bl)"><ellipse cx="50" cy="50" rx="44" ry="14" fill="#4f7cff" opacity=".6"/><ellipse cx="50" cy="50" rx="40" ry="10" fill="#9b6bff" opacity=".5" transform="rotate(35 50 50)"/><circle cx="50" cy="50" r="7" fill="#fff4cc"/></g></svg>`;

// ---------- Content ----------
const BH = ['BLACK HOLE', 'கருந்துளை'], NS = ['NEUTRON STAR', 'நியூட்ரான் நட்சத்திரம்'], WD = ['WHITE DWARF', 'வெள்ளைக் குள்ளன்'], SN = ['SUPERNOVA', 'சூப்பர்நோவா'], PL = ['PLANET', 'கோள்'];
const ITEMS = {
  1: [
    { cl: [['Extremely strong gravitational field.', 'மிகவும் வலுவான ஈர்ப்பு விசை.'], ['Light cannot escape from within its event horizon.', 'Event Horizon-க்கு உள்ளிருந்து ஒளி வெளியேற முடியாது.'], ['Hot matter around it can emit X-rays.', 'அதைச் சுற்றியுள்ள சூடான பொருள் X-rays வெளியிடலாம்.'], ['It may form when a massive star collapses.', 'மிகப்பெரிய நட்சத்திரம் சுருங்கும்போது உருவாகலாம்.']], o: [BH, NS, WD, PL], a: 'BLACK HOLE', ex: ['Gravity so strong that not even light escapes from inside the event horizon.', 'ஈர்ப்பு விசை மிக வலுவானது; நிகழ்வு எல்லைக்குள் இருந்து ஒளியும் வெளியேற முடியாது.'] },
    { cl: [['Extremely dense.', 'மிகவும் அதிக அடர்த்தி.'], ['Mostly made of neutrons.', 'முக்கியமாக நியூட்ரான்களால் ஆனது.'], ['Can rotate extremely rapidly.', 'மிக வேகமாக சுழல முடியும்.'], ['Some are observed as pulsars.', 'சிலவை pulsar-களாகக் காணப்படுகின்றன.']], o: [BH, NS, WD, SN], a: 'NEUTRON STAR', ex: ['A city-sized core left after a massive star explodes, packed with neutrons.', 'மிகப்பெரிய நட்சத்திரம் வெடித்த பின் மிஞ்சும், நியூட்ரான்கள் நிறைந்த நகர அளவு மையம்.'] },
    { cl: [['About Earth-sized.', 'ஏறக்குறைய பூமி அளவு.'], ['Very dense.', 'மிகவும் அதிக அடர்த்தி.'], ['Remnant of a Sun-like star.', 'சூரியனைப் போன்ற நட்சத்திரத்தின் எஞ்சிய பகுதி.'], ['No longer undergoing normal hydrogen fusion.', 'வழக்கமான ஹைட்ரஜன் இணைவு இனி நடைபெறுவதில்லை.']], o: [BH, NS, WD, SN], a: 'WHITE DWARF', ex: ['The hot, dense core left behind by a Sun-like star. The Sun will end this way.', 'சூரியனைப் போன்ற நட்சத்திரத்தின் சூடான, அடர்த்தியான எஞ்சிய மையம். சூரியனும் இப்படி முடியும்.'] },
    { cl: [['Extremely powerful stellar event.', 'மிக சக்திவாய்ந்த நட்சத்திர நிகழ்வு.'], ['Can briefly outshine an entire galaxy.', 'சிறிது நேரம் ஒரு முழு விண்மீன் திரளை விட பிரகாசமாக இருக்கலாம்.'], ['Can occur at the end of the life of a massive star.', 'மிகப்பெரிய நட்சத்திரத்தின் வாழ்வின் முடிவில் நிகழலாம்.'], ['Can create and distribute heavy elements.', 'கனமான தனிமங்களை உருவாக்கி பரப்ப முடியும்.']], o: [BH, NS, WD, SN], a: 'SUPERNOVA', ex: ['A stellar explosion that spreads heavy elements into space.', 'கனமான தனிமங்களை விண்வெளியில் பரப்பும் நட்சத்திர வெடிப்பு.'] }
  ],
  2: (() => {
    const mv = [['Object is moving away', 'பொருள் விலகிச் செல்கிறது'], ['Object is moving toward us', 'பொருள் நம்மை நோக்கி வருகிறது'], ['Object is getting smaller', 'பொருள் சிறிதாகிறது'], ['Object is becoming hotter', 'பொருள் வெப்பமாகிறது']];
    return [
      { v: () => spec(28), q: ['What is most likely happening?', 'என்ன நிகழ்கிறது?'], o: mv, a: mv[0][0], ex: ['RED SHIFT · சிவப்பு மாற்றம்', 'Light is shifted toward longer wavelengths when the source is moving away from the observer.', 'ஒளி மூலம் பார்வையாளரிடமிருந்து விலகிச் செல்லும்போது ஒளி நீண்ட wavelength பக்கம் மாறும்.'] },
      { v: () => spec(-28), q: ['Which interpretation is most likely?', 'எது மிகவும் பொருத்தமான விளக்கம்?'], o: mv, a: mv[1][0], ex: ['BLUE SHIFT · நீல மாற்றம்', 'Light is shifted toward shorter wavelengths when the source is moving toward the observer.', 'ஒளி மூலம் பார்வையாளரை நோக்கி வரும்போது ஒளி குறுகிய wavelength பக்கம் மாறும்.'] },
      { v: temp, q: ['Which star is hotter?', 'எந்த நட்சத்திரம் அதிக வெப்பமானது?'], o: [['STAR A', 'நட்சத்திரம் A'], ['STAR B', 'நட்சத்திரம் B'], ['Same temperature', 'ஒரே வெப்பநிலை']], a: 'STAR A', ex: ['TEMPERATURE · வெப்பநிலை', 'Hotter objects emit more strongly toward shorter wavelengths.', 'அதிக வெப்பமான பொருட்களின் கதிர்வீச்சு குறுகிய wavelength பகுதியில் அதிகமாக இருக்கும்.'] }
    ];
  })(),
  3: [
    { v: transit, q: ['A telescope sees a star dim slightly at regular intervals. What could cause this?', 'தொலைநோக்கி ஒரு நட்சத்திரம் சீரான இடைவெளியில் சிறிது மங்குவதைக் காண்கிறது. காரணம் என்ன?'], o: [['Planet passing in front of the star', 'நட்சத்திரத்தின் முன் கடந்து செல்லும் கோள்'], ['Galaxy collision', 'விண்மீன் திரள் மோதல்'], ['Star disappearing permanently', 'நட்சத்திரம் நிரந்தரமாக மறைதல்'], ['Black hole swallowing the star', 'கருந்துளை நட்சத்திரத்தை விழுங்குதல்']], a: 'Planet passing in front of the star', ex: ['TRANSIT METHOD · கடப்பு முறை', 'This is the basic transit method used to detect exoplanets.', 'ஒரு புறக்கோள் நட்சத்திரத்தின் முன் கடந்து செல்லும்போது அதன் ஒளி சிறிதளவு குறையலாம்.'] },
    { v: () => dat([['A', 'Moon — 384,000 km', 'நிலா — 384,000 கி.மீ'], ['B', 'Sun — 150 million km', 'சூரியன் — 15 கோடி கி.மீ'], ['C', 'Proxima Centauri — 4.24 light-years', 'ப்ராக்சிமா சென்டாரி — 4.24 ஒளியாண்டுகள்']]), q: ['Which object is farthest from Earth?', 'பூமியிலிருந்து மிகத் தொலைவில் உள்ள பொருள் எது?'], o: [['Moon', 'நிலா'], ['Sun', 'சூரியன்'], ['Proxima Centauri', 'ப்ராக்சிமா சென்டாரி']], a: 'Proxima Centauri', ex: ['WHY LIGHT-YEARS? · ஏன் ஒளியாண்டு?', 'Star distances are too large to express conveniently in km. 4.24 light-years is about 40 trillion km.', 'நட்சத்திரங்களுக்கு இடையிலான தூரங்கள் மிகப்பெரியவை என்பதால் light-year போன்ற அலகுகள் பயன்படுத்தப்படுகின்றன.'] },
    { v: () => dat([['PLANET A · கோள் A', '900 K · Atmosphere: Unknown', '900 K · வளிமண்டலம்: தெரியவில்லை'], ['PLANET B · கோள் B', '290 K · Possible atmosphere · Possible liquid water', '290 K · வளிமண்டலம் இருக்கலாம் · திரவ நீர் இருக்கலாம்'], ['PLANET C · கோள் C', '80 K · No known atmosphere', '80 K · அறியப்பட்ட வளிமண்டலம் இல்லை']]), q: ['Which planet would you investigate first for possible habitability?', 'வாழத்தகுதி பற்றி முதலில் எந்த கோளை ஆராய்வீர்கள்?'], o: [['PLANET A', 'கோள் A'], ['PLANET B', 'கோள் B'], ['PLANET C', 'கோள் C']], a: 'PLANET B', ex: ['SCIENTIFIC CAUTION · அறிவியல் கவனம்', 'Planet B has conditions that make it a more interesting candidate for further investigation. This does not prove life exists.', 'கோள் B மேலும் ஆய்வு செய்ய ஏற்ற சூழ்நிலைகளைக் கொண்டுள்ளது; ஆனால் அங்கு உயிர் இருப்பதாக இது உறுதிப்படுத்தாது.'] }
  ]
};
const TITLES = { 1: ['COSMIC DETECTIVE', 'விண்வெளி விசாரணை'], 2: ['READ THE LIGHT', 'ஒளியை பகுப்பாய்வு செய்'], 3: ['SPACE OBSERVATION LAB', 'விண்வெளி கண்காணிப்பு ஆய்வகம்'], 4: ['COSMIC SCALE', 'அண்டத்தின் அளவு'] };
const INTRO = { 1: ['An unknown object has been detected.', 'ஒரு அறியப்படாத விண்பொருள் கண்டறியப்பட்டுள்ளது.'], 2: ['Stars and galaxies reveal information through the light they emit.', 'நட்சத்திரங்களும் விண்மீன் திரள்களும் அவை வெளியிடும் ஒளியின் மூலம் தகவல்களை வழங்குகின்றன.'], 3: ['Interpret the data like an astronomer.', 'ஒரு வானியலாளரைப் போல தரவை விளக்குங்கள்.'], 4: ['Your spacecraft has lost its cosmic reference. Reconstruct the hierarchy.', 'உங்கள் விண்கலம் அண்டக் குறிப்பை இழந்துவிட்டது. வரிசையை மீட்டமைக்கவும்.'] };
const RES = { 1: ['INVESTIGATION COMPLETE', 'விசாரணை நிறைவு', 'CASES SOLVED', 'வழக்குகள் தீர்க்கப்பட்டன', 'PROCEED TO LIGHT ANALYSIS', 'ஒளி பகுப்பாய்வுக்குச் செல்'], 2: ['LIGHT ANALYSIS COMPLETE', 'ஒளி பகுப்பாய்வு நிறைவு', 'CHALLENGES SOLVED', 'சவால்கள் முடிந்தன', 'PROCEED TO OBSERVATION LAB', 'ஆய்வகத்திற்குச் செல்'], 3: ['OBSERVATION LAB COMPLETE', 'கண்காணிப்பு ஆய்வகம் நிறைவு', 'CHALLENGES SOLVED', 'சவால்கள் முடிந்தன', 'PROCEED TO COSMIC SCALE', 'அண்டத்தின் அளவுக்குச் செல்'] };
const FB = { 1: ['TARGET IDENTIFIED', 'இலக்கு கண்டறியப்பட்டது'], 2: ['ANALYSIS CORRECT', 'பகுப்பாய்வு சரியானது'], 3: ['OBSERVATION CONFIRMED', 'கண்டறிதல் உறுதி செய்யப்பட்டது'] };
const SCALE = [['EARTH', 'பூமி', 'Diameter ≈ 12,700 km', 'விட்டம் ≈ 12,700 கி.மீ'], ['SOLAR SYSTEM', 'சூரிய குடும்பம்', 'Earth–Sun distance ≈ 1 AU (150 million km)', 'பூமி–சூரியன் தூரம் ≈ 1 AU (15 கோடி கி.மீ)'], ['MILKY WAY', 'பால்வெளி', 'About 100,000 light-years across', 'சுமார் 1,00,000 ஒளியாண்டுகள் குறுக்களவு'], ['LOCAL GROUP', 'உள்ளூர் விண்மீன் குழு', 'Millions of light-years across', 'பல மில்லியன் ஒளியாண்டுகள் குறுக்களவு'], ['GALAXY CLUSTER', 'விண்மீன் கூட்டம்', 'Tens of millions of light-years across', 'பல பத்து மில்லியன் ஒளியாண்டுகள் குறுக்களவு'], ['OBSERVABLE UNIVERSE', 'காணக்கூடிய பிரபஞ்சம்', 'About 93 billion light-years across', 'சுமார் 93 பில்லியன் ஒளியாண்டுகள் குறுக்களவு']];

// ---------- Core functions ----------
const key = () => `r${gameState.currentRound}c${ui.i || 0}`;
function startGame() { gameState.startTime = Date.now(); ui = { view: 'brief' }; render(); }
function loadRound() {
  const r = gameState.currentRound;
  if (r === 4) { ui = { view: 'r4', sel: null, drag: null, msg: '' }; do { ui.order = shuffle(SCALE.map((_, i) => i)); } while (ui.order.every((v, i) => v === i)); }
  else { ui = { view: 'q', i: 0 }; loadItem(); return; }
  render();
}
function loadItem() {
  const it = ITEMS[gameState.currentRound][ui.i];
  Object.assign(ui, { sel: null, wrong: [], solved: false, pts: 0, msg: '', clues: 1, ord: shuffle(it.o.map((_, i) => i)) });
  gameState.cluesUsed[key()] = 1; render();
}
function showClue() { if (ui.clues < 4) { ui.clues++; gameState.cluesUsed[key()] = ui.clues; render(); } }
function calculateScore() {
  const r = gameState.currentRound, base = r === 1 ? [200, 150, 100, 50][ui.clues - 1] : r === 2 ? 150 : 200;
  return base + (!gameState.attempts[key()] ? 50 : 0);
}
function checkAnswer() {
  const it = ITEMS[gameState.currentRound][ui.i];
  if (ui.sel === null) return;
  if (it.o[ui.sel][0] === it.a) { ui.pts = calculateScore(); gameState.score += ui.pts; ui.solved = true; ui.msg = ''; }
  else { gameState.attempts[key()] = (gameState.attempts[key()] || 0) + 1; ui.wrong.push(ui.sel); ui.sel = null; showFeedback(false); }
  render();
}
function showFeedback(ok) { ui.msg = ok ? '' : `<div class="msg try">${bi('NOT CONFIRMED', 'உறுதி செய்யப்படவில்லை')}${bi('RECHECK THE EVIDENCE · TRY AGAIN', 'ஆதாரங்களை மீண்டும் கவனியுங்கள் · மீண்டும் முயற்சிக்கவும்')}</div>`; }
function nextItem() {
  if (ui.i < ITEMS[gameState.currentRound].length - 1) { ui.i++; loadItem(); } else completeRound();
}
function completeRound() { gameState.completedRounds.push(gameState.currentRound); ui = { view: 'res' }; render(); }
function checkCosmicOrder() {
  const right = ui.order.filter((v, i) => v === i).length;
  if (right === 6) { gameState.score += 300 + (!gameState.attempts.r4 ? 50 : 0); gameState.completedRounds.push(4); showReveal(); }
  else { gameState.attempts.r4 = (gameState.attempts.r4 || 0) + 1; ui.msg = `<div class="msg try">${bi('NOT CONFIRMED', 'உறுதி செய்யப்படவில்லை')}${bi(`${right} of 6 in the right place. Recheck the evidence.`, `6-ல் ${right} சரியான இடத்தில் உள்ளன. மீண்டும் கவனியுங்கள்.`)}</div>`; render(); }
}
function swapCards(a, b) { [ui.order[a], ui.order[b]] = [ui.order[b], ui.order[a]]; ui.sel = null; ui.msg = ''; render(); }
function showReveal() {
  ui = { view: 'rv', stage: 0, fin: false }; render(); clearInterval(rvTimer);
  rvTimer = setInterval(() => { ui.stage++; if (ui.stage >= 5) { ui.fin = true; clearInterval(rvTimer); } render(); }, 1700);
}
function updateProgress() {
  const show = ['q', 'res', 'r4'].includes(ui.view), r = gameState.currentRound;
  $('#prog').hidden = !show; $('#score').textContent = gameState.score;
  document.querySelectorAll('.st').forEach(s => { const n = +s.dataset.r, d = gameState.completedRounds.includes(n); s.classList.toggle('done', d); s.classList.toggle('act', n === r && !d); s.classList.toggle('lock', n > r); });
  document.querySelectorAll('#prog b').forEach((b, i) => b.classList.toggle('on', gameState.completedRounds.includes(i + 1)));
}
const fmt = ms => { const s = Math.round(ms / 1000); return String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
function updateTimer() { if (gameState.startTime && !endTime) $('#time').textContent = fmt(Date.now() - gameState.startTime); }
function showFinalScreen() { endTime = Date.now(); $('#time').textContent = fmt(endTime - gameState.startTime); ui = { view: 'end' }; render(); }
function resetGame() {
  clearInterval(rvTimer); endTime = null;
  Object.assign(gameState, { currentRound: 1, score: 0, startTime: null, completedRounds: [], attempts: {}, cluesUsed: {} });
  $('#time').textContent = '00:00'; ui = { view: 'land' }; render();
}

// ---------- Screens ----------
const btn = (act, e, t, x = '', c = '') => `<button class="btn ${c}" data-act="${act}" ${x}>${bi(e, t)}</button>`;
const head = r => `<div class="kick">ROUND 0${r}${ui.i !== undefined && ITEMS[r] ? ` · ${ui.i + 1}/${ITEMS[r].length}` : ''}</div><h2>${bi(...TITLES[r])}</h2><p class="ins">${bi(...INTRO[r])}</p>`;
const screens = {
  land: () => `<section class="panel hero ctr">${orb()}<div class="kick">SPACE WEEK 2026 · DAY 02</div>
    ${bi('ASTRONOMY & ASTROPHYSICS', 'வானியல் மற்றும் வானியற்பியல்')}<h1>${bi('COSMIC INVESTIGATION', 'விண்வெளி விசாரணை')}</h1>
    <p class="lbl">${bi('OBSERVE • ANALYZE • DECODE • DISCOVER', 'கவனி • பகுப்பாய்வு செய் • கண்டுபிடி • ஆராய்')}</p>
    <p class="ins">${bi('Not everything in the universe can be seen directly. Can you figure out what the evidence is telling you?', 'பிரபஞ்சத்தில் உள்ள அனைத்தையும் நேரடியாக பார்க்க முடியாது. கிடைக்கும் ஆதாரங்களிலிருந்து அதை கண்டுபிடிக்க முடியுமா?')}</p>
    <p class="pill" style="display:inline-block">${bi('MISSION TIME · 5–8 MINUTES', 'பணி நேரம் · 5–8 நிமிடங்கள்')}</p>
    ${btn('start', 'BEGIN INVESTIGATION', 'விசாரணையை தொடங்கு')}</section>`,
  brief: () => `<section class="panel"><div class="kick">MISSION BRIEFING</div><h2>${bi('MISSION BRIEFING', 'பணி விளக்கம்')}</h2>
    <div class="clues">${[['You are an astronomy investigator.', 'நீங்கள் ஒரு விண்வெளி ஆராய்ச்சியாளர்.'], ['Your instruments have detected several unknown cosmic objects.', 'உங்கள் கருவிகள் சில அறியப்படாத விண்பொருட்களை கண்டறிந்துள்ளன.'], ['Use observations, light and data to identify them.', 'கிடைக்கும் தகவல், ஒளி மற்றும் தரவுகளைப் பயன்படுத்தி அவற்றை கண்டறியுங்கள்.']].map(c => `<div class="cl">${bi(...c)}</div>`).join('')}
    <div class="cl">${bi('Earlier answers earn more points, but there is no penalty for needing more clues.', 'விரைவான பதில்களுக்கு அதிக புள்ளிகள்; கூடுதல் குறிப்புகள் தேவைப்பட்டால் தவறில்லை.')}</div></div>
    ${btn('accept', 'ACCEPT MISSION', 'பணியை ஏற்கவும்')}</section>`,
  q: () => {
    const r = gameState.currentRound, it = ITEMS[r][ui.i], last = ui.i === ITEMS[r].length - 1;
    const body = r === 1
      ? `<div class="kick" style="margin-top:14px">CASE FILE #0${ui.i + 1}</div><div class="clues">${it.cl.slice(0, ui.clues).map((c, k) => `<div class="cl"><small>CLUE 0${k + 1}</small>${bi(...c)}</div>`).join('')}</div>${!ui.solved && ui.clues < 4 ? btn('clue', 'REVEAL CLUE', 'குறிப்பை பார்க்கவும்', '', 'sec') : ''}<p class="lbl">${bi('What is it?', 'இது என்ன?')}</p>`
      : `${it.v()}<h3>${bi(...it.q)}</h3>`;
    const opts = ui.ord.map(i => `<button class="chip opt ${ui.sel === i ? 'sel' : ''} ${ui.wrong.includes(i) ? 'no' : ''} ${ui.solved && it.o[i][0] === it.a ? 'ok' : ''}" data-act="opt" data-i="${i}" ${ui.solved ? 'disabled' : ''}>${bi(...it.o[i])}</button>`).join('');
    const ex = r === 1 ? `<b>${bi(...it.o.find(o => o[0] === it.a))}</b>${bi(...it.ex)}` : `<b>${it.ex[0]}</b>${bi(it.ex[1], it.ex[2])}`;
    return `<section class="panel">${head(r)}${body}<div class="opts">${opts}</div>${ui.msg}
      ${ui.solved ? `<div class="fb"><b>${bi(...FB[r])}</b>${ex}<div class="pts">+${ui.pts} · COSMIC SCORE ${gameState.score}</div></div>${btn('next', last ? 'CONTINUE' : 'NEXT', last ? 'தொடரவும்' : 'அடுத்தது')}` : btn('lock', 'LOCK ANSWER', 'பதிலை உறுதி செய்யவும்', ui.sel === null ? 'disabled' : '')}</section>`;
  },
  res: () => { const r = gameState.currentRound, t = RES[r], n = ITEMS[r].length; return `<section class="panel ctr"><h1>${bi(t[0], t[1])}</h1><div class="stat"><div><small>${t[2]} · ${t[3]}</small><b>${n} / ${n}</b></div><div><small>COSMIC SCORE</small><b>${gameState.score}</b></div></div>${btn('proceed', t[4], t[5])}</section>`; },
  r4: () => `<section class="panel">${head(4)}
    <p class="lbl">${bi('SMALL → LARGE. Drag cards, or tap two cards to swap.', 'சிறியது → பெரியது. இழுக்கவும், அல்லது இரண்டு அட்டைகளைத் தொட்டு இடமாற்றுங்கள்.')}</p>
    <div>${ui.order.map((v, i) => `<div class="ord ${ui.sel === i ? 'sel' : ''}" draggable="true" data-act="card" data-i="${i}"><span class="n">${i + 1}</span>${bi(SCALE[v][0], SCALE[v][1])}</div>`).join('')}</div>
    ${ui.msg}${btn('check', 'LOCK ANSWER', 'பதிலை உறுதி செய்யவும்')}</section>`,
  rv: () => { const sz = [7, 24, 40, 56, 74, 94], s = SCALE[ui.stage]; return `<section class="panel ctr"><div class="rv">${sz.map((z, k) => k <= ui.stage ? `<div class="ring ${k === ui.stage && !ui.fin ? 'new' : ''}" style="width:${z}%"></div>` : '').join('')}<div class="dot"></div></div>
    <div class="rvl">${bi(s[0], s[1])}<div class="rvi">${bi(s[2], s[3])}</div></div>
    ${ui.fin ? `<p class="lbl">${bi('Approximate sizes. These are not exact boundaries.', 'தோராயமான அளவுகள்; துல்லியமான எல்லைகள் அல்ல.')}</p>${btn('finish', 'COMPLETE MISSION', 'பணியை நிறைவு செய்')}` : ''}</section>`; },
  end: () => `<section class="panel ctr"><div class="kick">COSMIC INVESTIGATION · விண்வெளி விசாரணை</div><h1>${bi('MISSION COMPLETE', 'பணி நிறைவு')}</h1>
    <div class="tick"><span>CASES SOLVED 4/4</span><span>LIGHT ANALYSIS 3/3</span><span>OBSERVATION LAB 3/3</span><span>COSMIC SCALE ✓</span></div>
    <div class="stat"><div><small>COSMIC SCORE</small><b>${gameState.score}</b></div><div><small>TIME · நேரம்</small><b>${fmt(endTime - gameState.startTime)}</b></div></div>
    <p class="ins">${bi('COSMIC INVESTIGATOR', 'விண்வெளி ஆராய்ச்சியாளர்')}</p>
    <p class="quote">${bi("You didn't just memorize the universe. You used evidence to understand it.", 'நீங்கள் பிரபஞ்சத்தை மனப்பாடம் செய்யவில்லை. ஆதாரங்களைப் பயன்படுத்தி அதை புரிந்துகொண்டீர்கள்.')}</p>
    ${btn('again', 'PLAY AGAIN', 'மீண்டும் விளையாடு')}</section>`
};
function render() { app.innerHTML = screens[ui.view](); document.body.className = 'm-' + lang; updateProgress(); }

// ---------- Events ----------
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
  if (a === 'start') startGame();
  else if (a === 'accept') { gameState.currentRound = 1; loadRound(); }
  else if (a === 'clue') showClue();
  else if (a === 'opt') { ui.sel = +el.dataset.i; ui.msg = ''; render(); }
  else if (a === 'lock') checkAnswer();
  else if (a === 'next') nextItem();
  else if (a === 'proceed') { gameState.currentRound++; loadRound(); }
  else if (a === 'card') { const i = +el.dataset.i; if (ui.sel === null) { ui.sel = i; render(); } else if (ui.sel === i) { ui.sel = null; render(); } else swapCards(ui.sel, i); }
  else if (a === 'check') checkCosmicOrder();
  else if (a === 'finish') showFinalScreen();
  else if (a === 'again') resetGame();
});
app.addEventListener('dragstart', e => { const c = e.target.closest('.ord'); if (c) { ui.drag = +c.dataset.i; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', ui.drag); } });
app.addEventListener('dragover', e => { if (e.target.closest('.ord')) e.preventDefault(); });
app.addEventListener('drop', e => { const c = e.target.closest('.ord'); if (c && ui.drag != null) { e.preventDefault(); const to = +c.dataset.i; if (to !== ui.drag) swapCards(ui.drag, to); ui.drag = null; } });
$('.lang').addEventListener('click', e => { const b = e.target.closest('[data-lang]'); if (!b) return; lang = b.dataset.lang; document.querySelectorAll('.lang button').forEach(x => x.classList.toggle('on', x === b)); render(); });
setInterval(updateTimer, 1000);
ui = { view: 'land' }; render();
