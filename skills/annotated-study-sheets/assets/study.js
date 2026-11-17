/* Annotated Study Sheets — slide + study-sheet engine
   Navigation, handwritten study sheet with pencil marks (N), note editing (E), presenter view (P),
   figure viewer, overview (O), help (?), blackout (B). No dependencies: works from file://.
   https://github.com/RodrigoPascual/annotated-study-sheets · MIT

   Optional configuration, before this script:
     <script>window.STUDY = { author: 'Ada Lovelace · Analytical Society', title: 'Short talk title',
       lang: 'en' | 'es', hideInBar: ['Intro', 'References'], short: { 'Long section name': 'Short' },
       colorize: [{ match: 'Sentinel-2', color: '#0072B2' }], openSheet: false }</script>  */
(() => {
  'use strict';

  const CFG = Object.assign({ author: '', title: document.title, lang: 'en', hideInBar: [], short: {}, colorize: [], openSheet: false }, window.STUDY || {});
  const T = {
    en: { sheet: 'Notes & explanations', page: 'sheet', edit: '✎ edit', view: '✓ view sheet', save: 'save file', load: 'load', export: 'export text',
      restore: 'restore note', original: 'Original notes', loaded: 'Notes loaded', savedLocal: 'Saved in this browser', noLocal: 'Could not save in the browser: use “save file”',
      gap: 'room for your own notes', empty: 'No notes on this slide.', next: 'Next', last: 'Last slide', now: 'Now', notes: 'Notes', goto: 'Go to', restored: 'Note restored',
      popup: 'The browser blocked the window: allow pop-ups for this file', notesFrom: 'Notes loaded from ', badFile: 'That file has no notes for this deck',
      downloaded: 'Downloaded notes.js: move it next to index.html', savedTo: 'Notes saved to ',
      boxes: { idea: 'Key idea', warn: 'Watch out!', source: 'From the literature', asked: 'If asked', example: 'Example', formula: 'Formula' },
      help: [['→ Space PgDn', 'Next build or slide'], ['← PgUp', 'Previous'], ['Home End', 'First / last'], ['12 + Enter', 'Go to slide 12'],
        ['N', 'Study sheet: annotated notes with pencil marks on the slide (hover a numbered block)'], ['E', 'With the sheet open: edit this slide’s notes (Esc to go back)'],
        ['P', 'Presenter view in another window (current, next, notes, timer)'], ['O', 'Overview of all slides'], ['F', 'Fullscreen'], ['B .', 'Black screen'],
        ['Click a figure', 'Zoom it (wheel to zoom, drag to pan, Esc to close)'], ['Ctrl+S', 'Save notes to notes.js'], ['?', 'This help']], helpTitle: 'Keyboard shortcuts',
      foot: 'Study sheet', pause: 'Pause', resume: 'Resume', reset: 'Reset timer', prev: '← Previous', nextB: 'Next →' },
    es: { sheet: 'Notas y explicaciones', page: 'hoja', edit: '✎ editar', view: '✓ ver apuntes', save: 'guardar archivo', load: 'cargar', export: 'exportar texto',
      restore: 'restaurar nota', original: 'Notas originales', loaded: 'Notas cargadas', savedLocal: 'Guardado en este navegador', noLocal: 'No se pudo guardar en el navegador: usa «guardar archivo»',
      gap: 'hueco libre para tus notas', empty: 'Sin notas en esta diapositiva.', next: 'Siguiente', last: 'Última diapositiva', now: 'Ahora', notes: 'Notas', goto: 'Ir a', restored: 'Nota restaurada',
      popup: 'El navegador ha bloqueado la ventana: permite ventanas emergentes', notesFrom: 'Notas cargadas de ', badFile: 'Ese archivo no contiene notas de esta presentación',
      downloaded: 'Descargado notas.js: muévelo junto a index.html', savedTo: 'Notas guardadas en ',
      boxes: { idea: 'Idea clave', warn: '¡Ojo!', source: 'Según la bibliografía', asked: 'Si te preguntan', example: 'Ejemplo', formula: 'Fórmula' },
      help: [['→ Espacio AvPág', 'Siguiente paso o diapositiva'], ['← RePág', 'Anterior'], ['Inicio Fin', 'Primera / última'], ['12 + Intro', 'Ir a la diapositiva 12'],
        ['N', 'Hoja de apuntes: notas con marcas a lápiz sobre la diapositiva'], ['E', 'Con la hoja abierta: editar las notas (Esc para volver)'],
        ['P', 'Vista de presentador en otra ventana'], ['O', 'Vista general'], ['F', 'Pantalla completa'], ['B .', 'Pantalla en negro'],
        ['Clic en una figura', 'Ampliarla (rueda, arrastrar, Esc)'], ['Ctrl+S', 'Guardar las notas en notas.js'], ['?', 'Esta ayuda']], helpTitle: 'Atajos de teclado',
      foot: 'Hoja de apuntes', pause: 'Pausar', resume: 'Reanudar', reset: 'Reiniciar tiempo', prev: '← Anterior', nextB: 'Siguiente →' },
  }[CFG.lang === 'es' ? 'es' : 'en'];

  const W = 1600, H = 900;
  const KEY = 'study-sheets:' + location.pathname + ':notes';
  const KEY_W = 'study-sheets:sheet-width';
  const $ = (sel, root = document) => root.querySelector(sel);

  const stage = $('#stage');
  const deck = $('#deck');
  const slides = Array.from(deck.querySelectorAll(':scope > section.slide'));
  const N = slides.length;
  let cur = 0, build = 0;

  // ------------------------------------------------------------------ setup
  let section = '';
  const sectionStart = [];
  const used = new Set();
  const slug = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function titleOf(s) {
    if (s.dataset.title) return s.dataset.title;
    const h = s.querySelector('h1, h2');
    if (!h) return s.id;
    const c = h.cloneNode(true);
    c.querySelectorAll('.kicker').forEach(k => k.remove());
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  slides.forEach((s, i) => {
    if (!s.id) {
      let base = slug(titleOf(s)) || 's' + (i + 1), id = base, k = 2;
      while (used.has(id)) id = base + '-' + k++;
      s.id = id;
    }
    used.add(s.id);
    if (s.dataset.section && s.dataset.section !== section) { section = s.dataset.section; sectionStart.push(i); }
    if (!sectionStart.length) sectionStart.push(0);
    s.dataset.sectionEff = section;
    if (s.classList.contains('page') && !s.querySelector('.pageno')) {
      const p = document.createElement('div'); p.className = 'pageno'; p.textContent = (i + 1) + ' / ' + N; s.appendChild(p);
    }
  });

  // top bar: one column per section with a dot per slide; bottom bar: author | title | page
  const hidden = new Set(CFG.hideInBar);
  const parts = [];
  slides.forEach((s, i) => {
    const sec = s.dataset.sectionEff;
    if (!sec || hidden.has(sec)) return;
    let p = parts.find(x => x.name === sec);
    if (!p) parts.push(p = { name: sec, idx: [] });
    p.idx.push(i);
  });
  slides.forEach((s, i) => {
    if (s.classList.contains('cover') || s.classList.contains('page')) return;
    const bar = document.createElement('div');
    bar.className = 'bar-top';
    parts.forEach(p => {
      const c = document.createElement('div');
      c.className = 'sec' + (p.name === s.dataset.sectionEff ? ' current' : '');
      const a = document.createElement('a');
      a.className = 'sec-name'; a.textContent = p.name; a.dataset.go = p.idx[0];
      c.appendChild(a);
      const dots = document.createElement('div');
      dots.className = 'dots';
      p.idx.forEach(j => {
        const d = document.createElement('a');
        d.className = 'dot' + (j === i ? ' current' : '');
        d.dataset.go = j; d.title = (j + 1) + '. ' + titleOf(slides[j]);
        dots.appendChild(d);
      });
      c.appendChild(dots);
      bar.appendChild(c);
    });
    s.appendChild(bar);
    const foot = document.createElement('div');
    foot.className = 'bar-foot';
    foot.innerHTML = '<span></span><span></span><span></span>';
    foot.children[0].textContent = CFG.author;
    foot.children[1].textContent = CFG.title;
    foot.children[2].textContent = (i + 1) + ' / ' + N;
    s.appendChild(foot);
  });
  deck.addEventListener('click', e => {
    const a = e.target.closest('.bar-top [data-go]');
    if (a) { e.preventDefault(); go(+a.dataset.go, 0); }
  });

  // ------------------------------------------------------------------ scale
  function fit() {
    const k = Math.min(stage.clientWidth / W, stage.clientHeight / H);
    deck.style.transform = `translate(-50%, -50%) scale(${k})`;
  }
  window.addEventListener('resize', fit);
  new ResizeObserver(fit).observe(stage);

  // ------------------------------------------------------------------ navigation
  const builds = s => Array.from(s.querySelectorAll('.step'));
  const started = new Set();
  function go(i, mode = 0, fromHash = false) {
    i = Math.max(0, Math.min(N - 1, i));
    const changes = i !== cur || !slides[i].classList.contains('active');
    slides.forEach((s, j) => s.classList.toggle('active', j === i));
    cur = i;
    const bs = builds(slides[i]);
    build = mode === 'all' ? bs.length : 0;
    bs.forEach((b, j) => b.classList.toggle('shown', j < build));
    if (!fromHash) history.replaceState(null, '', location.search + '#' + (i + 1));
    if (changes) startWidget(slides[i]);
    paintSheet();
    updatePresenter();
    if (overview.classList.contains('open')) markOverview();
  }
  function next() {
    const bs = builds(slides[cur]);
    if (build < bs.length) { bs[build++].classList.add('shown'); updatePresenter(); return; }
    if (cur < N - 1) go(cur + 1, 0);
  }
  function prev() {
    const bs = builds(slides[cur]);
    if (build > 0) { bs[--build].classList.remove('shown'); updatePresenter(); return; }
    if (cur > 0) go(cur - 1, 'all');
  }
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return 0;
    if (/^\d+$/.test(h)) return Math.max(0, Math.min(N - 1, parseInt(h, 10) - 1));
    const j = slides.findIndex(s => s.id === h);
    return j < 0 ? 0 : j;
  }
  window.addEventListener('hashchange', () => { const j = fromHash(); if (j !== cur) go(j, 0, true); });

  // interactive slides: <section data-widget="name"> + window.WIDGETS.name = { init(slide), enter(slide) }
  function startWidget(s) {
    const name = s.dataset.widget;
    const w = name && (window.WIDGETS || {})[name];
    if (!w) return;
    try {
      if (!started.has(s.id)) { started.add(s.id); w.init && w.init(s); }
      w.enter && w.enter(s);
    } catch (e) { console.error('Widget', name, e); }
  }

  // ------------------------------------------------------------------ toast
  const toastEl = document.createElement('div');
  toastEl.id = 'toast';
  document.body.appendChild(toastEl);
  let tToast = 0;
  function toast(txt, ms = 1800) {
    toastEl.textContent = txt;
    toastEl.classList.add('show');
    clearTimeout(tToast);
    tToast = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  // ------------------------------------------------------------------ notes store
  function dedent(t) {
    const l = t.replace(/\r/g, '').split('\n');
    while (l.length && !l[0].trim()) l.shift();
    while (l.length && !l[l.length - 1].trim()) l.pop();
    const ind = l.filter(x => x.trim()).map(x => x.match(/^[ \t]*/)[0].length);
    const k = ind.length ? Math.min(...ind) : 0;
    return l.map(x => x.slice(k)).join('\n');
  }
  const defaults = {};
  slides.forEach(s => { const a = s.querySelector(':scope > aside.notes'); defaults[s.id] = a ? dedent(a.textContent) : ''; });
  const notes = Object.assign({}, defaults);
  let notesDate = '';
  function apply(pkg) {
    if (!pkg || typeof pkg.notes !== 'object') return false;
    Object.entries(pkg.notes).forEach(([id, txt]) => { if (id in notes && typeof txt === 'string') notes[id] = txt; });
    notesDate = pkg.saved || notesDate;
    return true;
  }
  const fromFile = window.SAVED_NOTES;                 // optional notes.js next to index.html
  if (fromFile) apply(fromFile);
  try {
    const local = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (local && (!fromFile || (local.saved || '') >= (fromFile.saved || ''))) apply(local);
  } catch (e) { /* storage unavailable */ }
  const pack = () => ({ format: 'study-sheets-v1', saved: new Date().toISOString(), notes });
  let tSave = 0;
  function saveLocal() {
    clearTimeout(tSave);
    tSave = setTimeout(() => {
      try { const p = pack(); localStorage.setItem(KEY, JSON.stringify(p)); notesDate = p.saved; status(T.savedLocal); }
      catch (e) { status(T.noLocal); }
    }, 350);
  }
  function download(name, text, type = 'text/plain') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  let handle = null;
  async function saveFile() {
    const text = '/* Study-sheet notes: loaded automatically when this file sits next to index.html */\n'
      + 'window.SAVED_NOTES = ' + JSON.stringify(pack(), null, 1) + ';\n';
    if (window.showSaveFilePicker) {
      try {
        if (!handle) handle = await window.showSaveFilePicker({ suggestedName: 'notes.js', types: [{ description: 'Notes', accept: { 'text/javascript': ['.js'] } }] });
        const w = await handle.createWritable();
        await w.write(text); await w.close();
        toast(T.savedTo + handle.name);
        return;
      } catch (e) { if (e && e.name === 'AbortError') return; handle = null; }
    }
    download('notes.js', text, 'text/javascript');
    toast(T.downloaded, 3200);
  }
  function loadFile() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.js,.json';
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        const t = (await f.text()).replace(/^[\s\S]*?window\.SAVED_NOTES\s*=\s*/, '').replace(/;\s*$/, '');
        if (!apply(JSON.parse(t))) throw new Error('format');
        saveLocal(); paintSheet(true); updatePresenter(true);
        toast(T.notesFrom + f.name);
      } catch (e) { toast(T.badFile, 2600); }
    };
    inp.click();
  }
  function exportText() {
    const l = ['# ' + document.title, ''];
    slides.forEach((s, i) => { l.push('## ' + (i + 1) + '. ' + titleOf(s), '', (notes[s.id] || '').trim() || '_(no notes)_', ''); });
    download('notes.md', l.join('\n'), 'text/markdown');
  }

  // ------------------------------------------------------------------ notes markup -> study sheet
  const SVGNS = 'http://www.w3.org/2000/svg';
  const ic = d => `<svg class="ic" viewBox="0 0 24 24" width="1em" height="1em"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICON = {
    idea: ic('M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z'),
    warn: ic('M12 3 2 20h20L12 3zM12 10v4M12 17v.5'),
    source: ic('M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 21a2 2 0 0 1 2-2h13v2H6M8 7h7M8 10.5h5'),
    asked: ic('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8M12 17v.4'),
    example: ic('M12 21v-8M12 13c0-4 3-7 8-7 0 4-3 7-8 7zM12 15c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z'),
    formula: ic('M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 7h8M8 12h.5M12 12h.5M15.5 12h.5M8 16h.5M12 16h.5M15.5 16h.5'),
    pen: '<svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M3.5 20.5l1.2-5.2L15.6 4.4a2 2 0 0 1 2.8 0l1.2 1.2a2 2 0 0 1 0 2.8L8.7 19.3z" fill="currentColor"/><path d="M14 6l4 4" stroke="#FFFDF6" stroke-width="1.4"/></svg>',
  };
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function inline(t) {
    let h = esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/==(.+?)==/g, '<mark>$1</mark>')
      .replace(/(^|[\s(«"])\*(?!\s)(.+?)\*(?=$|[\s.,;:)»"])/g, '$1<i>$2</i>')
      .replace(/\[(\d{1,2})\]/g, '<span class="badge badge-s" data-ref="$1">$1</span>')
      .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
      .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    CFG.colorize.forEach(c => {
      h = h.replace(new RegExp('(^|[^\\p{L}\\p{N}_<])(' + reEsc(c.match) + '(?:s|es)?)(?![\\p{L}\\p{N}_])(?![^<]*>)', 'gu'), `$1<span style="color:${c.color};font-weight:700">$2</span>`);
    });
    return h;
  }
  const BOXES = [[/^!\s+(.*)$/, 'idea'], [/^>\s*(.*)$/, 'source'], [/^\?\?\s*(.*)$/, 'asked'],
    [/^(?:warn|ojo):\s*(.*)$/i, 'warn'], [/^(?:ex|ej):\s*(.*)$/i, 'example'], [/^f:\s*(.*)$/i, 'formula']];
  function parse(txt) {
    const blocks = [];
    let b = null;
    const open = (type, extra = {}) => { b = Object.assign({ type, parts: [] }, extra); blocks.push(b); return b; };
    const cont = () => (b && !b.box ? b : open('loose'));
    (txt || '').replace(/\r/g, '').split('\n').forEach(line => {
      const l = line.trim();
      if (!l) { b = null; return; }
      let m;
      if ((m = l.match(/^#\s+(.*)$/))) { open('title').parts.push(['p', m[1]]); b = null; return; }
      if ((m = l.match(/^\((\d{1,2})\)\s*(.*)$/))) { open('num', { n: m[1] }).parts.push(['p', m[2]]); return; }
      for (const [re, type] of BOXES) {
        if ((m = l.match(re))) { if (!(b && b.type === type && b.box)) open(type, { box: true }); b.parts.push(['p', m[1]]); return; }
      }
      if ((m = l.match(/^(?:→|->)\s*(.*)$/))) { open('next').parts.push(['p', m[1]]); b = null; return; }
      if (/^\|.*\|$/.test(l)) {
        if (/^\|[\s:|-]+\|$/.test(l)) return;
        cont().parts.push(['tr', l.slice(1, -1).split('|').map(c => c.trim())]);
        return;
      }
      if ((m = l.match(/^--\s+(.*)$/))) { cont().parts.push(['li2', m[1]]); return; }
      if ((m = l.match(/^[-–•]\s+(.*)$/))) { cont().parts.push(['li', m[1]]); return; }
      cont().parts.push(['p', l]);
    });
    return blocks;
  }
  function partsHtml(parts, first = '') {
    let h = '', openEl = null;
    const close = () => { if (openEl) { h += openEl === 'ul' ? '</ul>' : '</tbody></table>'; openEl = null; } };
    const lead = () => { const x = first; first = ''; return x; };
    parts.forEach(([k, t]) => {
      if (k === 'p') { close(); if (t || first) h += '<p>' + lead() + (t ? ' ' + inline(t) : '') + '</p>'; return; }
      if (k === 'tr') {
        if (first) h += '<p>' + lead() + '</p>';
        if (openEl !== 'table') { close(); openEl = 'table'; h += '<table class="mini"><thead><tr>' + t.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>'; return; }
        h += '<tr>' + t.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>';
        return;
      }
      if (first) h += '<p>' + lead() + '</p>';
      if (openEl !== 'ul') { close(); h += '<ul>'; openEl = 'ul'; }
      h += '<li' + (k === 'li2' ? ' class="sub"' : '') + '>' + inline(t) + '</li>';
    });
    close();
    return h;
  }
  function notesHtml(txt) {
    const bl = parse(txt);
    if (!bl.length) return `<p class="empty">${T.empty}</p>`;
    return bl.map((b, i) => {
      const st = ` style="--i:${i}"`;
      if (b.type === 'title') return `<h3 class="h-title"${st}><span>${inline(b.parts[0][1])}</span></h3>`;
      if (b.type === 'num') return `<div class="block num" data-n="${b.n}"${st}>${partsHtml(b.parts, `<span class="badge">${b.n}</span>`)}</div>`;
      if (b.box) return `<div class="block box ${b.type}"${st}>${partsHtml(b.parts, `<span class="bt">${ICON[b.type]} ${T.boxes[b.type]}</span>`)}</div>`;
      if (b.type === 'next') return `<div class="block next"${st}><span class="ar">→</span> ${inline(b.parts[0][1])}</div>`;
      return `<div class="block"${st}>${partsHtml(b.parts)}</div>`;
    }).join('');
  }

  // pencil strokes: seeded RNG so every mark is drawn the same way each time
  function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function smooth(p) {
    let d = 'M' + p[0][0].toFixed(1) + ' ' + p[0][1].toFixed(1);
    for (let k = 1; k < p.length - 1; k++) {
      const mx = (p[k][0] + p[k + 1][0]) / 2, my = (p[k][1] + p[k + 1][1]) / 2;
      d += ` Q${p[k][0].toFixed(1)} ${p[k][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const u = p[p.length - 1];
    return d + ` L${u[0].toFixed(1)} ${u[1].toFixed(1)}`;
  }
  function pencilRect(x0, y0, x1, y1, seed, r = 12) {
    const al = rnd(seed), j = a => (al() - .5) * a;
    r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
    const p = [];
    const side = (ax, ay, bx, by) => {
      const L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / 70));
      for (let k = 1; k <= n; k++) { const t = k / n; p.push([ax + (bx - ax) * t + j(2.2), ay + (by - ay) * t + j(2.2)]); }
    };
    const s0 = [x0 + r + j(4), y0 + j(3)];
    p.push(s0);
    side(s0[0], s0[1], x1 - r, y0); p.push([x1 - r * .3, y0 + r * .3]);
    side(x1, y0 + r, x1, y1 - r); p.push([x1 - r * .3, y1 - r * .3]);
    side(x1 - r, y1, x0 + r, y1); p.push([x0 + r * .3, y1 - r * .3]);
    side(x0, y1 - r, x0, y0 + r); p.push([x0 + r * .4, y0 + r * .2]);
    p.push([x0 + r * 2.4 + j(6), y0 - 2 + j(2)]);
    return smooth(p);
  }
  function pencilBracket(x, y0, y1, side, seed) {
    const al = rnd(seed), j = a => (al() - .5) * a, t = side === 'right' ? -9 : 9;
    const p = [[x + t + j(1), y0 + j(1)], [x + j(.6), y0 + j(.6)]];
    const n = Math.max(2, Math.round((y1 - y0) / 70));
    for (let k = 1; k < n; k++) p.push([x + j(1.6), y0 + (y1 - y0) * k / n]);
    p.push([x + j(.6), y1 + j(.6)], [x + t + j(1), y1 + j(1)]);
    return 'M' + p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L');
  }

  // targets of the marks, in 1600 x 900 canvas coordinates
  const scaleOf = s => s.getBoundingClientRect().width / W || 1;
  function targets(s) {
    const sb = s.getBoundingClientRect(), k = scaleOf(s), list = [];
    const box = r => [(r.left - sb.left) / k, (r.top - sb.top) / k, (r.right - sb.left) / k, (r.bottom - sb.top) / k];
    s.querySelectorAll('[data-n]').forEach(e => {
      if (e.closest('.notes, .marks')) return;
      const type = e.dataset.mark || (e.matches('figure, img, svg, .frame, .two-figs, .stats') ? 'badge' : 'bracket');
      const inner = e.matches('figure, .frame') && e.querySelector('img, svg');        // badge on the picture itself, not its box
      const r = (inner || e).getBoundingClientRect();
      if (!r.width || !r.height) return;
      const o = { n: e.dataset.n, c: box(r), el: e, type };
      if (type === 'bracket' && !e.matches('tr, table, thead, tbody')) {
        const t = [Infinity, Infinity, -Infinity, -Infinity], rg = document.createRange();
        const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, { acceptNode: x => /\S/.test(x.nodeValue) ? 1 : 3 });
        for (let x = tw.nextNode(); x; x = tw.nextNode()) {
          rg.selectNodeContents(x);
          for (const q of rg.getClientRects()) { const c = box(q); t[0] = Math.min(t[0], c[0]); t[1] = Math.min(t[1], c[1]); t[2] = Math.max(t[2], c[2]); t[3] = Math.max(t[3], c[3]); }
        }
        if (t[0] < Infinity) o.c = t;
        const lst = e.matches('li') ? e.parentElement : e;
        o.left = box(lst.getBoundingClientRect())[0];
        const ct = e.closest('.col, figure, .content') || s;
        o.limit = box(ct.getBoundingClientRect())[2];
      }
      list.push(o);
    });
    // panels of a figure or regions of a page: <img data-zones="2:0,0,50,48; 3:50,0,100,48"> (x0,y0,x1,y1 in % of the image)
    s.querySelectorAll('img[data-zones]').forEach(img => {
      const r = img.getBoundingClientRect();
      if (!r.width) return;
      img.dataset.zones.split(';').forEach(z => {
        const m = z.trim().match(/^(\d{1,2})\s*:\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?::\s*([\w-]+))?$/);
        if (!m) return;
        const [x0, y0, x1, y1] = m.slice(2, 6).map(Number);
        list.push({ n: m[1], el: img, type: m[6] || 'badge', c: [(r.left - sb.left + r.width * x0 / 100) / k, (r.top - sb.top + r.height * y0 / 100) / k,
          (r.left - sb.left + r.width * x1 / 100) / k, (r.top - sb.top + r.height * y1 / 100) / k] });
      });
    });
    return list.sort((a, b) => (+a.n) - (+b.n));
  }
  const MARK_COLOR = { formula: 'purple', green: 'green' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const removeMarks = s => s.querySelectorAll(':scope > svg.marks').forEach(m => m.remove());
  function drawMarks(s, i, fast) {
    removeMarks(s);
    const list = targets(s);
    const t0 = fast ? 0.1 : 0.55, dt = fast ? 0.16 : 0.32;
    Array.from(s.querySelectorAll('.hl')).forEach((h, j) => h.style.setProperty('--d', (t0 + 0.25 + j * 0.3) + 's'));
    if (!list.length) return;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'marks');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    list.forEach((o, j) => {
      const [x0, y0, x1, y1] = o.c;
      const seed = 7919 * (i + 1) + 104729 * (+o.n) + j;
      const g = document.createElementNS(SVGNS, 'g');
      const [kind, side] = o.type.split('-');                          // e.g. box-r: pencil box, badge on its right
      g.setAttribute('class', 'mark ' + (MARK_COLOR[kind] || 'red'));
      g.dataset.n = o.n;
      g.style.setProperty('--d', (t0 + j * dt) + 's');
      let cx, cy, d = '';
      if (kind === 'bracket') {
        const lt = o.limit == null ? W : o.limit;
        const right = o.left == null ? (x1 > W - 230 || x0 > 230) : (x1 + 46 <= lt || lt > W - 140);
        const a = y0 + 2, b = Math.max(y0 + 22, y1 - 2);
        if (right) { const x = clamp(x1 + 14, 60, W - 44); d = pencilBracket(x, a, b, 'right', seed); cx = x + 20; }
        else { const x = clamp((o.left == null ? x0 : o.left) - 14, 44, W - 60); d = pencilBracket(x, a, b, 'left', seed); cx = x - 20; }
        cy = (a + b) / 2;
      } else if (kind === 'badge') { cx = x0 - 19; cy = y0 + 13; }
      else if (kind === 'corner') { cx = x1 - 17; cy = y0 + 17; }
      else {                                                                  // box, formula, green (+ -l -r -t -b: badge side)
        d = pencilRect(x0 - 8, y0 - 7, x1 + 8, y1 + 7, seed);
        const sd = side || (x0 > 70 ? 'l' : 'r');
        if (sd === 'r') { cx = x1 + 30; cy = (y0 + y1) / 2; }
        else if (sd === 't') { cx = x0 + 22; cy = y0 - 26; }
        else if (sd === 'b') { cx = x0 + 22; cy = y1 + 26; }
        else { cx = x0 - 30; cy = (y0 + y1) / 2; }
      }
      cx = clamp(cx, 18, W - 18); cy = clamp(cy, 18, H - 18);
      if (d) {
        const path = document.createElementNS(SVGNS, 'path');
        path.setAttribute('d', d); path.setAttribute('pathLength', '1'); path.setAttribute('class', 'stroke');
        g.appendChild(path);
      }
      const ring = document.createElementNS(SVGNS, 'path');           // shows when hovering its block in the sheet
      ring.setAttribute('d', pencilRect(x0 - 7, y0 - 6, x1 + 7, y1 + 6, seed + 3, 14));
      ring.setAttribute('class', 'ring');
      g.appendChild(ring);
      const seal = document.createElementNS(SVGNS, 'g');
      seal.setAttribute('class', 'seal');
      seal.innerHTML = `<circle cx="${cx}" cy="${cy}" r="15"/><text x="${cx}" y="${cy + 5.6}" text-anchor="middle">${o.n}</text>`;
      g.appendChild(seal);
      svg.appendChild(g);
      o.g = g; o.ax = cx; o.ay = cy;
    });
    s.appendChild(svg);
    s._marks = list;
  }

  // pencil arrow from a block of the sheet to its badge on the slide
  const arrows = document.createElementNS(SVGNS, 'svg');
  arrows.id = 'arrows';
  arrows.innerHTML = '<defs><marker id="tip" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path d="M0 1.2 L9.5 5 L0 8.8 z" fill="#C62828"/></marker></defs><path class="ar"/>';
  document.body.appendChild(arrows);
  function arrow(block, n, on) {
    const s = slides[cur], p = arrows.querySelector('.ar');
    (s._marks || []).forEach(o => o.g && o.g.classList.toggle('focus', !!on && o.n === n));
    if (!on) { arrows.classList.remove('show'); return; }
    const o = (s._marks || []).find(x => x.n === n);
    if (!o || !block) return;
    const sb = s.getBoundingClientRect(), k = scaleOf(s), br = block.getBoundingClientRect();
    const x1 = br.left - 8, y1 = br.top + 15, x2 = sb.left + (o.ax + 19) * k, y2 = sb.top + o.ay * k;
    const dx = Math.max(50, (x1 - x2) * 0.42);
    p.setAttribute('d', `M${x1} ${y1} C${x1 - dx} ${y1 + 14}, ${x2 + dx} ${y2 - 36}, ${x2} ${y2}`);
    p.setAttribute('marker-end', 'url(#tip)');
    arrows.classList.remove('show'); void arrows.getBoundingClientRect(); arrows.classList.add('show');
  }

  // the sheet
  const sheet = document.createElement('aside');
  sheet.id = 'sheet';
  sheet.innerHTML = `
    <div class="s-head">
      <div class="l1"><span class="s-title"><span class="pen">${ICON.pen}</span> ${T.sheet}</span><span class="pageof"></span></div>
      <div class="crumb"></div>
      <div class="tabs"></div>
      <svg class="rule" viewBox="0 0 400 6" preserveAspectRatio="none"><path d="M0 3 Q50 1 100 3.4 T200 2.6 T300 3.5 T400 2.8"/></svg>
    </div>
    <div class="paper"><div class="render"></div><textarea spellcheck="true" aria-label="Notes"></textarea></div>
    <div class="toolbar">
      <button data-a="edit">${T.edit}</button><button data-a="save">${T.save}</button><button data-a="load">${T.load}</button>
      <button data-a="export">${T.export}</button><button data-a="restore">${T.restore}</button><span class="status"></span>
    </div>
    <div class="s-foot"><span>${esc(T.foot + (CFG.title ? ' · ' + CFG.title : ''))}</span><span class="gap">${ICON.pen} ${T.gap}</span></div>`;
  document.body.appendChild(sheet);
  const grip = document.createElement('div');
  grip.className = 'grip';
  sheet.appendChild(grip);
  const area = $('textarea', sheet);
  const render = $('.render', sheet);
  const status = txt => { $('.status', sheet).textContent = txt; };

  const sectionNames = sectionStart.map(i => slides[i].dataset.sectionEff || '');
  $('.tabs', sheet).innerHTML = sectionNames.length > 1 ? sectionNames.map((t, j) => `<span data-j="${j}" title="${esc(t)}">${esc(CFG.short[t] || t)}</span>`).join('') : '';
  $('.tabs', sheet).addEventListener('click', e => { const j = e.target.dataset && e.target.dataset.j; if (j != null) go(sectionStart[+j], 0); });

  try { const a = localStorage.getItem(KEY_W); if (a) document.documentElement.style.setProperty('--sheet-w', a); } catch (e) { /* */ }
  grip.addEventListener('pointerdown', e => {
    grip.setPointerCapture(e.pointerId);
    document.body.classList.add('dragging');
    const move = ev => document.documentElement.style.setProperty('--sheet-w', Math.max(26, Math.min(60, 100 * (window.innerWidth - ev.clientX) / window.innerWidth)).toFixed(1) + 'vw');
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', () => {
      grip.removeEventListener('pointermove', move);
      document.body.classList.remove('dragging');
      try { localStorage.setItem(KEY_W, getComputedStyle(document.documentElement).getPropertyValue('--sheet-w').trim()); } catch (err) { /* */ }
      markIfOpen();
    }, { once: true });
  });

  const isOpen = () => document.body.classList.contains('sheet-open');
  const editing = () => sheet.classList.contains('editing');
  let tMarks = 0;
  function markIfOpen(delay = 80) {
    clearTimeout(tMarks);
    if (!isOpen()) return;
    const s = slides[cur], i = cur;
    tMarks = setTimeout(() => {
      const imgs = Array.from(s.querySelectorAll('img')).filter(im => !im.complete);
      Promise.all(imgs.map(im => new Promise(r => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })))
        .then(() => Promise.all(Array.from(s.querySelectorAll('img')).map(im => (im.decode ? im.decode().catch(() => {}) : null))))
        .then(() => requestAnimationFrame(() => { if (cur === i && isOpen()) drawMarks(s, i, !document.body.classList.contains('opening')); }));
    }, delay);
  }
  function paintSheet(force = false) {
    const s = slides[cur];
    $('.pageof', sheet).textContent = T.page + ' ' + (cur + 1) + ' / ' + N;
    const sec = s.dataset.sectionEff;
    $('.crumb', sheet).innerHTML = (sec ? esc(sec) + ' <span class="sep">&gt;</span> ' : '') + esc(titleOf(s));
    const js = sectionStart.filter(i => i <= cur).length - 1;
    sheet.querySelectorAll('.tabs span').forEach((e, j) => e.classList.toggle('current', j === js));
    if (force || document.activeElement !== area || area.dataset.id !== s.id) { area.value = notes[s.id] || ''; area.dataset.id = s.id; }
    if (!isOpen()) return;
    if (render.dataset.id !== s.id || force) {
      render.innerHTML = notesHtml(notes[s.id]);
      render.dataset.id = s.id;
      render.classList.remove('enter'); void render.offsetWidth; render.classList.add('enter');
      render.scrollTop = 0;
    }
    slides.forEach((x, j) => { if (j !== cur) removeMarks(x); });
    markIfOpen(document.body.classList.contains('opening') ? 520 : 60);
  }
  const refOf = b => b.dataset.n || b.dataset.ref;
  render.addEventListener('mouseover', e => { const b = e.target.closest('.badge-s, .block.num'); if (b && !b.contains(e.relatedTarget)) arrow(b, refOf(b), true); });
  render.addEventListener('mouseout', e => { const b = e.target.closest('.badge-s, .block.num'); if (b && !b.contains(e.relatedTarget)) arrow(null, null, false); });
  area.addEventListener('input', () => { notes[area.dataset.id] = area.value; saveLocal(); updatePresenter(true); });
  function toggleEdit(on = !editing()) {
    sheet.classList.toggle('editing', on);
    $('[data-a="edit"]', sheet).textContent = on ? T.view : T.edit;
    if (on) { area.value = notes[slides[cur].id] || ''; area.dataset.id = slides[cur].id; area.focus(); }
    else { render.dataset.id = ''; paintSheet(true); }
  }
  sheet.addEventListener('click', e => {
    const a = e.target.closest('button') && e.target.closest('button').dataset.a;
    if (a === 'edit') toggleEdit();
    else if (a === 'save') saveFile();
    else if (a === 'load') loadFile();
    else if (a === 'export') exportText();
    else if (a === 'restore') { const id = slides[cur].id; notes[id] = defaults[id]; saveLocal(); paintSheet(true); updatePresenter(true); toast(T.restored); }
  });
  let tFit = 0;
  function toggleSheet() {
    const open = !isOpen();
    document.body.classList.toggle('sheet-open', open);
    document.body.classList.toggle('opening', open);
    clearInterval(tFit);
    const t0 = performance.now();
    tFit = setInterval(() => { fit(); if (performance.now() - t0 > 760) clearInterval(tFit); }, 16);
    setTimeout(() => document.body.classList.remove('opening'), 900);
    if (open) { render.dataset.id = ''; paintSheet(true); }
    else { toggleEdit(false); slides.forEach(removeMarks); arrow(null, null, false); }
  }
  window.addEventListener('resize', () => markIfOpen(200));
  status(notesDate ? T.loaded + ' (' + new Date(notesDate).toLocaleString() + ')' : T.original);

  // ------------------------------------------------------------------ presenter view
  let pw = null, clock = null, t0 = 0, acc = 0, running = false;
  function presenterHtml() {
    const base = location.href.replace(/[?#].*$/, '');
    const css = (document.querySelector('link[href$="study.css"]') || {}).getAttribute ? document.querySelector('link[href$="study.css"]').getAttribute('href') : 'study.css';
    return `<!doctype html><html><head><meta charset="utf-8"><base href="${base.replace(/"/g, '%22')}">
<title>Presenter</title><link rel="stylesheet" href="${css}"><style>
html,body{background:#1b1b1b;color:#eee;overflow:hidden;height:100%;margin:0}
.pp{display:grid;grid-template-columns:56fr 44fr;gap:16px;height:100vh;padding:16px;box-sizing:border-box}
.c1,.c2{display:flex;flex-direction:column;gap:14px;min-height:0}
.view{position:relative;background:#000;aspect-ratio:16/9;overflow:hidden;border-radius:4px;flex:none}
.view .canvas{position:absolute;left:0;top:0;width:1600px;height:900px;transform-origin:0 0}
.view .canvas .slide{opacity:1;visibility:visible;transition:none;color:var(--ink)}
.lb{font:600 12px var(--font);letter-spacing:.08em;text-transform:uppercase;color:#9a9a9a}
#sheet.pres{position:relative;inset:auto;transform:none;width:auto;flex:1;min-height:0;display:block;border:0;border-radius:6px;overflow:hidden;
background-color:var(--s-paper);background-image:radial-gradient(circle,var(--s-dots) 1.05px,transparent 1.45px);background-size:19px 19px}
#sheet.pres .render{padding:16px 22px 30px;font-size:19px}
.time{display:flex;align-items:baseline;gap:22px;font-variant-numeric:tabular-nums}
.time .cr{font:600 54px var(--font);color:#fff}.time .now{font:400 26px var(--font);color:#aaa}
.cnt{font:600 20px var(--font);color:#ddd}.bt{display:flex;gap:8px;flex-wrap:wrap}
.bt button{font:14px var(--font);padding:8px 12px;border-radius:6px;border:1px solid #444;background:#2b2b2b;color:#eee;cursor:pointer}
.nx{font:15px var(--font);color:#888}</style></head><body><div class="pp">
<div class="c1"><div class="lb">${T.now}</div><div class="view" id="v-cur"><div class="canvas"></div></div>
<div class="lb" id="t-notes">${T.notes}</div><div id="sheet" class="pres"><div class="render" id="p-render"></div></div></div>
<div class="c2"><div class="lb">${T.next}</div><div class="view" id="v-next"><div class="canvas"></div></div><div class="nx" id="p-next"></div>
<div class="time"><span class="cr" id="p-clock">00:00</span><span class="now" id="p-now"></span></div><div class="cnt" id="p-count"></div>
<div class="bt"><button id="b-prev">${T.prev}</button><button id="b-next">${T.nextB}</button><button id="b-pause">${T.pause}</button><button id="b-zero">${T.reset}</button></div>
</div></div></body></html>`;
  }
  function scaleViews() {
    if (!pw || pw.closed) return;
    pw.document.querySelectorAll('.view').forEach(v => { v.querySelector('.canvas').style.transform = `scale(${v.clientWidth / W})`; });
  }
  function cloneSlide(s, all) {
    const c = s.cloneNode(true);
    c.classList.add('active');
    c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    c.querySelectorAll('svg.marks').forEach(e => e.remove());
    if (all) c.querySelectorAll('.step').forEach(p => p.classList.add('shown'));
    return c;
  }
  function updatePresenter(onlyNotes = false) {
    if (!pw || pw.closed) return;
    const d = pw.document, s = slides[cur];
    const pr = d.getElementById('p-render');
    if (pr.dataset.id !== s.id || onlyNotes === true) { pr.innerHTML = notesHtml(notes[s.id]); pr.dataset.id = s.id; }
    if (onlyNotes === true) return;
    d.querySelector('#v-cur .canvas').replaceChildren(d.importNode(cloneSlide(s, false), true));
    d.querySelector('#v-next .canvas').replaceChildren(cur < N - 1 ? d.importNode(cloneSlide(slides[cur + 1], true), true) : d.createTextNode(''));
    d.getElementById('p-next').textContent = cur < N - 1 ? T.next + ': ' + titleOf(slides[cur + 1]) : T.last;
    d.getElementById('p-count').textContent = (cur + 1) + ' / ' + N + (builds(s).length ? '  (' + build + '/' + builds(s).length + ')' : '');
    d.getElementById('t-notes').textContent = T.notes + ' · ' + titleOf(s);
    scaleViews();
  }
  function tick() {
    if (!pw || pw.closed) { clearInterval(clock); clock = null; return; }
    const ms = acc + (running ? Date.now() - t0 : 0);
    pw.document.getElementById('p-clock').textContent = String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    pw.document.getElementById('p-now').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function openPresenter() {
    if (pw && !pw.closed) { pw.focus(); return; }
    pw = window.open('', 'study-presenter', 'width=1300,height=820');
    if (!pw) { toast(T.popup, 3500); return; }
    pw.document.open(); pw.document.write(presenterHtml()); pw.document.close();
    const d = pw.document;
    d.addEventListener('keydown', keys);
    pw.addEventListener('resize', scaleViews);
    d.getElementById('b-prev').onclick = prev;
    d.getElementById('b-next').onclick = next;
    d.getElementById('b-pause').onclick = () => {
      if (running) { acc += Date.now() - t0; running = false; d.getElementById('b-pause').textContent = T.resume; }
      else { t0 = Date.now(); running = true; d.getElementById('b-pause').textContent = T.pause; }
    };
    d.getElementById('b-zero').onclick = () => { acc = 0; t0 = Date.now(); tick(); };
    acc = 0; t0 = Date.now(); running = true;
    clearInterval(clock); clock = setInterval(tick, 500);
    setTimeout(() => { updatePresenter(); tick(); }, 300);
  }

  // ------------------------------------------------------------------ figure viewer
  const viewer = document.createElement('div');
  viewer.id = 'viewer';
  viewer.innerHTML = '<img alt=""><div class="zoom"></div><div class="btns"><button data-z="+">+</button><button data-z="-">−</button><button data-z="0">⤢</button><button data-z="x">✕</button></div><div class="cap"></div>';
  document.body.appendChild(viewer);
  const vImg = $('img', viewer);
  const v = { k: 1, x: 0, y: 0, fit: 1 };
  const vApply = () => { vImg.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.k})`; $('.zoom', viewer).textContent = Math.round(100 * v.k / v.fit) + ' %'; };
  function vFit() {
    const nw = vImg.naturalWidth || 1, nh = vImg.naturalHeight || 1;
    v.fit = v.k = Math.min(window.innerWidth * .94 / nw, window.innerHeight * .86 / nh);
    v.x = (window.innerWidth - nw * v.k) / 2; v.y = (window.innerHeight * .94 - nh * v.k) / 2;
    vApply();
  }
  function vZoom(f, cx = window.innerWidth / 2, cy = window.innerHeight / 2) {
    const k = Math.max(v.fit * .5, Math.min(v.fit * 10, v.k * f));
    v.x = cx - (cx - v.x) * (k / v.k); v.y = cy - (cy - v.y) * (k / v.k); v.k = k;
    vApply();
  }
  function openViewer(src, cap) {
    vImg.onload = vFit; vImg.src = src;
    $('.cap', viewer).textContent = cap || '';
    viewer.classList.add('open');
    if (vImg.complete && vImg.naturalWidth) vFit();
  }
  const closeViewer = () => viewer.classList.remove('open');
  viewer.addEventListener('wheel', e => { e.preventDefault(); vZoom(Math.exp(-e.deltaY * 0.0016), e.clientX, e.clientY); }, { passive: false });
  let drag = null;
  vImg.addEventListener('pointerdown', e => { e.preventDefault(); vImg.setPointerCapture(e.pointerId); drag = { x: e.clientX, y: e.clientY, ox: v.x, oy: v.y }; });
  vImg.addEventListener('pointermove', e => { if (!drag) return; v.x = drag.ox + e.clientX - drag.x; v.y = drag.oy + e.clientY - drag.y; vApply(); });
  vImg.addEventListener('pointerup', () => { drag = null; });
  vImg.addEventListener('dblclick', e => { if (v.k > v.fit * 1.05) vFit(); else vZoom(2.5, e.clientX, e.clientY); });
  viewer.addEventListener('click', e => {
    const z = e.target.dataset && e.target.dataset.z;
    if (z === '+') vZoom(1.35); else if (z === '-') vZoom(1 / 1.35); else if (z === '0') vFit();
    else if (z === 'x' || e.target === viewer) closeViewer();
  });
  window.addEventListener('resize', () => { if (viewer.classList.contains('open')) vFit(); });
  deck.addEventListener('click', e => {
    const f = e.target.closest('.frame');
    const img = f && f.querySelector('img');
    if (!img) return;
    const fc = f.closest('figure') && f.closest('figure').querySelector('figcaption');
    openViewer(img.dataset.large || img.currentSrc || img.src, fc ? fc.textContent.replace(/\s+/g, ' ').trim() : img.alt);
  });

  // ------------------------------------------------------------------ overview
  const overview = document.createElement('div');
  overview.id = 'overview';
  document.body.appendChild(overview);
  let overviewBuilt = false;
  function buildOverview() {
    let sec = null, grid = null;
    slides.forEach((s, i) => {
      if (s.dataset.sectionEff !== sec || !grid) {
        sec = s.dataset.sectionEff;
        if (sec) { const h = document.createElement('h3'); h.textContent = sec; overview.appendChild(h); }
        grid = document.createElement('div'); grid.className = 'grid'; overview.appendChild(grid);
      }
      const m = document.createElement('div');
      m.className = 'thumb'; m.dataset.i = i; m.title = (i + 1) + '. ' + titleOf(s);
      const c = document.createElement('div');
      c.className = 'canvas'; c.appendChild(cloneSlide(s, true)); m.appendChild(c);
      const n = document.createElement('span'); n.className = 'no'; n.textContent = i + 1; m.appendChild(n);
      m.addEventListener('click', () => { overview.classList.remove('open'); go(i, 0); });
      grid.appendChild(m);
    });
    overviewBuilt = true;
  }
  const markOverview = () => overview.querySelectorAll('.thumb').forEach(m => m.classList.toggle('current', +m.dataset.i === cur));
  function toggleOverview() {
    if (overview.classList.contains('open')) { overview.classList.remove('open'); return; }
    if (!overviewBuilt) buildOverview();
    overview.classList.add('open');
    overview.querySelectorAll('.thumb').forEach(m => { m.querySelector('.canvas').style.transform = `scale(${m.clientWidth / W})`; });
    markOverview();
    const a = overview.querySelector('.thumb.current');
    if (a) a.scrollIntoView({ block: 'center' });
  }

  // ------------------------------------------------------------------ help and blackout
  const help = document.createElement('div');
  help.id = 'help';
  help.innerHTML = `<div class="card"><h3>${T.helpTitle}</h3><table>${T.help.map(([k, d]) => `<tr><td>${k.split(' ').map(x => '<kbd>' + esc(x) + '</kbd>').join(' ')}</td><td>${esc(d)}</td></tr>`).join('')}</table></div>`;
  document.body.appendChild(help);
  help.addEventListener('click', () => help.classList.remove('open'));
  const black = document.createElement('div');
  black.id = 'blackout';
  document.body.appendChild(black);
  black.addEventListener('click', () => black.classList.remove('show'));

  // ------------------------------------------------------------------ keyboard
  let buf = '', tBuf = 0;
  const typing = t => t && t.closest && t.closest('textarea, input:not([type=range]):not([type=checkbox]):not([type=radio]), select, [contenteditable="true"]');
  function keys(e) {
    const t = e.target;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveFile(); return; }
    if (typing(t)) { if (e.key === 'Escape') { t.blur(); if (t === area) toggleEdit(false); } return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (viewer.classList.contains('open')) {
      if (e.key === 'Escape') closeViewer(); else if (e.key === '+' || e.key === '=') vZoom(1.35); else if (e.key === '-') vZoom(1 / 1.35); else if (e.key === '0') vFit();
      return;
    }
    if (help.classList.contains('open')) { help.classList.remove('open'); if (e.key === 'Escape' || e.key === '?') return; }
    if (black.classList.contains('show') && !['b', 'B', '.'].includes(e.key)) { black.classList.remove('show'); return; }
    const onControl = t && t.closest && t.closest('button, input[type=range], input[type=checkbox], a');
    if (onControl && (e.key === ' ' || e.key === 'Enter')) return;
    if (/^\d$/.test(e.key)) {
      buf += e.key; clearTimeout(tBuf); tBuf = setTimeout(() => { buf = ''; }, 1800);
      const j = parseInt(buf, 10) - 1;
      toast(T.goto + ' ' + buf + (slides[j] ? ': ' + titleOf(slides[j]) : '') + '  (Enter)');
      return;
    }
    switch (e.key) {
      case 'Enter': if (buf) { const j = parseInt(buf, 10) - 1; buf = ''; go(j, 0); } else next(); break;
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': go(0, 0); break;
      case 'End': go(N - 1, 0); break;
      case 'n': case 'N': toggleSheet(); break;
      case 'e': case 'E': if (isOpen()) toggleEdit(); else return; break;
      case 'p': case 'P': openPresenter(); break;
      case 'o': case 'O': toggleOverview(); break;
      case 'Escape': overview.classList.remove('open'); break;
      case 'f': case 'F': if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); break;
      case 'b': case 'B': case '.': black.classList.toggle('show'); break;
      case '?': case 'h': case 'H': help.classList.add('open'); break;
      default: return;
    }
  }
  document.addEventListener('keydown', keys);
  window.addEventListener('beforeunload', () => { if (pw && !pw.closed) pw.close(); });

  // ------------------------------------------------------------------ start
  fit();
  go(fromHash(), 0, true);
  if (/[?&]demo\b/.test(location.search)) setTimeout(toggleSheet, 900);   // ?demo#4: opens the sheet with its animation (for GIFs)
  else if (CFG.openSheet || /[?&](notes|sheet|annotated)\b/.test(location.search)) {   // index.html?notes#4 opens with the sheet
    document.body.classList.add('instant');
    toggleSheet();
    document.body.classList.remove('opening');
    setTimeout(() => document.body.classList.remove('instant'), 1500);
  }
  if (!location.hash) history.replaceState(null, '', location.search + '#1');
  window.STUDY_DECK = { go, next, prev, current: () => cur, total: N, notes, toggleSheet };
})();
