// Rocket Class Copy: content script.
// Always on; the toolbar icon pauses one tab. Hold the key left of 1 (physical
// Backquote, layout-independent) to inspect: hover highlights the element and
// shows its design bubble with spacing rulers, click copies an ID card.
// Passive by design: it reads the page and writes the clipboard, nothing else.
(() => {
  'use strict';
  if (window.__rocketClassCopy) return;
  window.__rocketClassCopy = true;

  let armed = true;        // always on (owner's rule); the toolbar icon pauses one tab
  let inspecting = false;  // true while the key is held
  let target = null;       // element under the cursor
  let lastX = -1;
  let lastY = -1;
  let flashTimer = 0;      // non-zero while the "copied" flash owns the bubble

  const Z = '2147483647';
  const BUBBLE_BG = '#091243';

  // ---------- overlay: highlight box + bubble ----------

  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed', zIndex: Z, pointerEvents: 'none', display: 'none',
    background: 'rgba(37, 99, 235, 0.10)',
    outline: '2px solid rgba(37, 99, 235, 0.85)',
    outlineOffset: '-1px',
  });

  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed', zIndex: Z, pointerEvents: 'none', display: 'none',
    boxSizing: 'border-box', maxWidth: '320px', background: BUBBLE_BG, color: '#f3f4f6',
    font: "14px/1.6 'Google Sans', 'Product Sans', Roboto, Arial, sans-serif",
    padding: '16px 20px', borderRadius: '8px',
  });

  // Spacing rulers: one translucent band per space between a container's
  // direct children, each labeled with the real measured distance.
  const bands = [];

  function mount() {
    if (!box.isConnected) document.documentElement.append(box, bubble);
  }

  // ---------- reading the element ----------

  const IMAGE_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'PICTURE', 'CANVAS']);
  // Tags that are text by nature even when their words sit inside a wrapper,
  // e.g. <button><span>Save</span></button>.
  const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'BUTTON', 'LABEL', 'SPAN', 'LI']);
  const TAG_UP = (el) => (el.tagName || '').toUpperCase();

  // h2 -> H2, div -> Div, img -> Img: first letter capitalized, per spec.
  function tagLabel(el) {
    const t = (el.tagName || '').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function kindOf(el) {
    if (IMAGE_TAGS.has(TAG_UP(el))) return 'image';
    if (hasOwnText(el) || (TEXT_TAGS.has(TAG_UP(el)) && (el.textContent || '').trim())) return 'text';
    return 'box';
  }

  function classesOf(el) {
    const raw = el.getAttribute && el.getAttribute('class');
    return raw ? raw.trim().replace(/\s+/g, ' ') : '';
  }

  function hasOwnText(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  }

  function toHex(color) {
    const m = /^rgba?\(([^)]+)\)$/.exec(color);
    if (!m) return color;
    const p = m[1].split(',').map((s) => parseFloat(s));
    if (p.length > 3 && p[3] < 1) return color; // real transparency stays readable
    const hex = (n) => Math.round(n).toString(16).padStart(2, '0');
    return ('#' + hex(p[0]) + hex(p[1]) + hex(p[2])).toUpperCase();
  }

  const isTransparent = (c) =>
    !c || c === 'transparent' || /^rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0(\.0+)?\s*\)$/.test(c);

  function weightName(w) {
    const names = {
      100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular',
      500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black',
    };
    return names[parseInt(w, 10)] || String(w);
  }

  // First family of the stack, unquoted: what the site asked the text to be.
  function fontName(family) {
    const first = (family || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
    return first || String(family);
  }

  function pxLabel(v) {
    const n = parseFloat(v);
    if (Number.isNaN(n)) return String(v);
    return (Number.isInteger(n) ? n : Math.round(n * 10) / 10) + 'px';
  }

  // Sides in the owner's order, L R T B. A zero side is omitted; all-zero -> "0".
  function sidesLabel(cs, prop) {
    const read = (side) => Math.round(parseFloat(cs[prop + side]) || 0);
    const parts = [['L', read('Left')], ['R', read('Right')], ['T', read('Top')], ['B', read('Bottom')]]
      .filter(([, v]) => v !== 0)
      .map(([s, v]) => s + v);
    return parts.length ? parts.join(' ') : '0';
  }

  // ---------- the bubble ----------

  function row(text, swatch) {
    const div = document.createElement('div');
    div.textContent = text; // page data stays text, never markup
    Object.assign(div.style, {
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    });
    if (swatch) {
      const s = document.createElement('span');
      Object.assign(s.style, {
        display: 'inline-block', width: '12px', height: '12px',
        background: swatch, border: '1px solid rgba(255, 255, 255, 0.45)',
        borderRadius: '2px', marginLeft: '8px', verticalAlign: '-1px',
      });
      div.appendChild(s);
    }
    bubble.appendChild(div);
  }

  function fillBubble(el) {
    bubble.textContent = '';
    const cls = classesOf(el);
    row(tagLabel(el) + ' · ' + (cls || '(no class)'));

    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const size = Math.round(r.width) + ' × ' + Math.round(r.height);
    const bg = cs.backgroundColor;
    const painted = !isTransparent(bg);
    const bgRow = () => row('Bg ' + (painted ? toHex(bg) : 'none'), painted ? bg : null);

    const kind = kindOf(el);
    if (kind === 'image') {
      row(size);
    } else if (kind === 'text') {
      row(fontName(cs.fontFamily));
      row(weightName(cs.fontWeight));
      row(pxLabel(cs.fontSize));
      row(toHex(cs.color), cs.color);
      // A button or link always owns its Bg row; other text shows one only
      // when it actually paints a background.
      if (painted || TAG_UP(el) === 'BUTTON' || TAG_UP(el) === 'A') bgRow();
      row('Padding ' + sidesLabel(cs, 'padding'));
    } else {
      row(size);
      bgRow();
      row('Margin ' + sidesLabel(cs, 'margin'));
      row('Padding ' + sidesLabel(cs, 'padding'));
    }
  }

  // ---------- placing ----------

  function place() {
    if (!target || !target.getBoundingClientRect) { hide(); return; }
    const r = target.getBoundingClientRect();
    Object.assign(box.style, {
      display: 'block',
      left: r.left + 'px', top: r.top + 'px',
      width: Math.max(0, r.width) + 'px', height: Math.max(0, r.height) + 'px',
    });
    bubble.style.display = 'block';
    const bh = bubble.offsetHeight;
    const bw = bubble.offsetWidth;
    let top = r.top - bh - 8;
    if (top < 4) top = Math.min(r.bottom + 8, innerHeight - bh - 4);
    bubble.style.top = top + 'px';
    bubble.style.left = Math.max(4, Math.min(r.left, innerWidth - bw - 8)) + 'px';
  }

  function clearBands() {
    for (const b of bands) b.remove();
    bands.length = 0;
  }

  function drawBands(el) {
    clearBands();
    if (!el || kindOf(el) !== 'box') return;
    const kids = [...el.children]
      .filter((c) => c !== box && c !== bubble && !bands.includes(c) &&
        c.getBoundingClientRect && getComputedStyle(c).display !== 'none')
      .map((c) => c.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i];
      const b = kids[i + 1];
      let geo = null;
      if (b.top - a.bottom >= 1) {
        geo = {
          left: Math.min(a.left, b.left), top: a.bottom,
          width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
          height: b.top - a.bottom, gap: b.top - a.bottom,
        };
      } else if (b.left - a.right >= 1) {
        geo = {
          left: a.right, top: Math.min(a.top, b.top),
          width: b.left - a.right,
          height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top),
          gap: b.left - a.right,
        };
      }
      if (!geo) continue; // overlapping or wrapped pair: nothing to measure
      const d = document.createElement('div');
      Object.assign(d.style, {
        position: 'fixed', zIndex: Z, pointerEvents: 'none',
        left: geo.left + 'px', top: geo.top + 'px',
        width: geo.width + 'px', height: geo.height + 'px',
        background: 'rgba(246, 170, 60, 0.30)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      });
      const chip = document.createElement('span');
      chip.textContent = String(Math.round(geo.gap));
      Object.assign(chip.style, {
        background: BUBBLE_BG, color: '#f3f4f6',
        font: "12px/1.4 'Google Sans', 'Product Sans', Roboto, Arial, sans-serif",
        padding: '1px 7px', borderRadius: '999px',
      });
      d.appendChild(chip);
      document.documentElement.appendChild(d);
      bands.push(d);
    }
  }

  function paint() {
    if (!inspecting || !target) { hide(); return; }
    if (!flashTimer) fillBubble(target);
    place();
    drawBands(target);
  }

  function hide() {
    box.style.display = 'none';
    bubble.style.display = 'none';
    clearBands();
  }

  function flash(text, ok) {
    if (flashTimer) clearTimeout(flashTimer);
    bubble.textContent = '';
    row(text);
    bubble.style.background = ok ? '#14532d' : '#7f1d1d';
    place();
    flashTimer = setTimeout(() => {
      flashTimer = 0;
      bubble.style.background = BUBBLE_BG;
      if (inspecting) paint();
    }, 700);
  }

  // ---------- mode ----------

  function startInspect() {
    if (inspecting || !armed) return;
    inspecting = true;
    mount();
    if (lastX >= 0) {
      const el = document.elementFromPoint(lastX, lastY);
      if (el) target = el;
    }
    paint();
  }

  function stopInspect() {
    inspecting = false;
    target = null;
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = 0;
      bubble.style.background = BUBBLE_BG;
    }
    hide();
  }

  function setArmed(on) {
    armed = !!on;
    if (!armed) stopInspect();
  }

  // ---------- the ID card ----------

  function ownWords(el, max) {
    const t = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!t) return '';
    const words = t.split(' ');
    return words.slice(0, max).join(' ') + (words.length > max ? ' …' : '');
  }

  function nameOf(el) {
    const cls = classesOf(el);
    return (el.tagName || '').toLowerCase() + (cls ? '.' + cls.split(' ')[0] : '');
  }

  function ordinal(n) {
    const r10 = n % 10;
    const r100 = n % 100;
    if (r10 === 1 && r100 !== 11) return n + 'st';
    if (r10 === 2 && r100 !== 12) return n + 'nd';
    if (r10 === 3 && r100 !== 13) return n + 'rd';
    return n + 'th';
  }

  function idCard(el) {
    const cls = classesOf(el);
    const words = ownWords(el, 8);

    const chain = [];
    let p = el.parentElement;
    while (p && p !== document.body && p !== document.documentElement && chain.length < 3) {
      chain.unshift(nameOf(p));
      p = p.parentElement;
    }

    let pos = '';
    if (el.parentElement) {
      const same = Array.from(el.parentElement.children).filter((c) => c.tagName === el.tagName);
      if (same.length > 1) pos = ' (' + ordinal(same.indexOf(el) + 1) + ' of ' + same.length + ')';
    }

    const lines = [
      'page:    ' + location.pathname,
      'element: ' + (el.tagName || '').toLowerCase() + (words ? ' · "' + words + '"' : ''),
      'classes: ' + (cls || '(none)'),
    ];
    if (chain.length || pos) {
      lines.push('inside:  ' + (chain.join(' > ') || '(page root)') + pos);
    }
    return lines.join('\n');
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fall through to the legacy path */ }
    try {
      // Plain-http client sites have no modern clipboard; the old path works.
      const prev = document.activeElement;
      const ta = document.createElement('textarea');
      ta.value = text;
      Object.assign(ta.style, {
        position: 'fixed', top: '0', left: '0', opacity: '0', pointerEvents: 'none',
      });
      document.documentElement.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (prev && prev.focus) prev.focus();
      return ok;
    } catch (e) {
      return false;
    }
  }

  // ---------- events ----------

  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Backquote' || !armed) return;
    e.preventDefault();            // on an armed tab the key belongs to the picker
    e.stopImmediatePropagation();
    if (!e.repeat) startInspect();
  }, true);

  document.addEventListener('keyup', (e) => {
    if (e.code !== 'Backquote') return;
    if (armed) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
    stopInspect();
  }, true);

  window.addEventListener('blur', () => stopInspect(), true);

  document.addEventListener('mousemove', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!inspecting) return;
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    if (el instanceof Element && el !== box && el !== bubble && !bubble.contains(el)) {
      target = el;
    }
    paint();
  }, true);

  window.addEventListener('scroll', () => { if (inspecting) { place(); drawBands(target); } }, true);
  window.addEventListener('resize', () => { if (inspecting) { place(); drawBands(target); } }, true);

  // While inspecting, the mouse belongs to the picker: nothing reaches the page,
  // so copying a link's card never navigates and a button never fires.
  const swallow = (e) => {
    if (!inspecting) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  for (const type of ['pointerdown', 'mousedown', 'mouseup', 'auxclick', 'dblclick']) {
    document.addEventListener(type, swallow, true);
  }

  document.addEventListener('click', (e) => {
    if (!inspecting) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    const pick = (el instanceof Element && el !== box && !bubble.contains(el)) ? el : target;
    if (!pick) return;
    copyText(idCard(pick)).then((ok) => flash(ok ? 'copied ✓' : 'copy failed', ok));
  }, true);

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'set-armed') setArmed(!!msg.armed);
    });
  }
})();
