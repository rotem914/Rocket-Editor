// Rocket Inspector: content script.
// Always on; the toolbar icon pauses one tab. Hold the key left of 1 (physical
// Backquote, layout-independent) to inspect: hover highlights the element and
// shows its design bubble with spacing rulers, click copies an ID card.
// Passive by design: it reads the page and writes the clipboard, nothing else.
(() => {
  'use strict';
  if (window.__rocketInspector) return;
  window.__rocketInspector = true;

  let armed = true;        // always on (owner's rule); the toolbar icon pauses one tab
  let inspecting = false;  // true while the key is held
  let target = null;       // element under the cursor
  let lastX = -1;
  let lastY = -1;
  let flashTimer = 0;      // non-zero while the "copied" flash owns the bubble
  let flashGen = 0;        // every swap claims one; an overtaken swap bows out
  let settleTimer = 0;     // waiting for the cursor to settle on a new element

  const Z = '2147483647';
  const BUBBLE_BG = '#1B32AE';
  const BUBBLE_PAD = '16px 20px';
  const BUBBLE_RADIUS = '13px';
  const FLASH_OK = '#0D7737';
  const FLASH_FAIL = '#7F1D1D';
  const FOOTER_COLOR = '#97A1D7';
  const GROUP_GAP = '8px';   // the breath between one group of rows and the next
  let bubbleDisplay = 'block';   // 'flex' while the confirmation panel owns the bubble

  // ---------- overlay: highlight box + bubble ----------

  const box = document.createElement('div');
  Object.assign(box.style, {
    // under the bands and their pills: the blue outline must never cross a number
    position: 'fixed', zIndex: '2147483644', pointerEvents: 'none', display: 'none',
    background: 'rgba(37, 99, 235, 0.10)',
    outline: '2px solid rgba(37, 99, 235, 0.85)',
    outlineOffset: '-1px',
  });

  const bubble = document.createElement('div');
  Object.assign(bubble.style, {
    position: 'fixed', zIndex: Z, pointerEvents: 'none', display: 'none',
    // pinned LTR: an RTL site must not right-align the rows or flip "#BFBFBF"
    direction: 'ltr', textAlign: 'left',
    boxSizing: 'border-box', maxWidth: '320px', background: BUBBLE_BG, color: '#f3f4f6',
    font: "14px/1.6 'Google Sans', 'Product Sans', Roboto, Arial, sans-serif",
    padding: BUBBLE_PAD, borderRadius: BUBBLE_RADIUS,
  });

  // The rows live one layer in, so a swap can fade and move all of them
  // together while the bubble itself stays exactly where it is.
  const content = document.createElement('div');
  bubble.appendChild(content);

  // Spacing rulers: one translucent band per space between a container's
  // direct children, each labeled with the real measured distance.
  const bands = [];
  // The outward bands directly above and below the element, remembered per
  // paint so the bubble can clear them instead of covering their pills.
  let outTopEdge = null;
  let outBottomEdge = null;

  function mount() {
    if (!box.isConnected) document.documentElement.append(box, bubble);
  }

  // ---------- reading the element ----------

  const IMAGE_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'PICTURE', 'CANVAS']);
  // Tags that are text by nature even when their words sit inside a wrapper,
  // e.g. <button><span>Save</span></button>.
  const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'A', 'BUTTON', 'LABEL', 'SPAN', 'LI']);
  const TAG_UP = (el) => (el.tagName || '').toUpperCase();
  // localName keeps SVG's real spelling: foreignObject, not foreignobject,
  // which is the form a search of the source has to match.
  const tagName = (el) => el.localName || (el.tagName || '').toLowerCase();

  // h2 -> H2, div -> Div, img -> Img: first letter capitalized, per spec.
  function tagLabel(el) {
    const t = tagName(el);
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

  const NON_VISIBLE_TEXT = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);

  // Text a person cannot see: markup that never renders, and the screen-reader
  // only labels Tailwind sites clip to a single pixel off-screen.
  function isHiddenText(el) {
    if (!el || NON_VISIBLE_TEXT.has(TAG_UP(el))) return true;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return true;
    const r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return !!r && r.width <= 1 && r.height <= 1;
  }

  // The element whose computed style describes the words a person actually
  // sees: itself when it holds its own text, otherwise its first text-bearing
  // descendant, because a wrapper's inherited font is not what got painted.
  function textStyleSource(el) {
    if (hasOwnText(el)) return el;
    let node = el.firstElementChild;
    for (let guard = 0; node && guard < 40; guard++) {
      if (!isHiddenText(node)) {
        if (hasOwnText(node)) return node;
        const deeper = textStyleSource(node);
        if (deeper !== node) return deeper;
      }
      node = node.nextElementSibling;
    }
    return el;
  }

  // Paint the colour on a one-pixel canvas and read it back, which is the only
  // way to learn what a modern colour space really is: Tailwind emits oklch()
  // and color-mix(), and reading the string cannot tell green from invisible.
  // Legacy rgb/rgba never takes this path, so exact values stay exact.
  let colorPad = null;
  function colorRGBA(c) {
    if (!c) return null;
    try {
      if (!colorPad) {
        const cv = document.createElement('canvas');
        cv.width = 1;
        cv.height = 1;
        colorPad = cv.getContext('2d', { willReadFrequently: true });
      }
      colorPad.fillStyle = '#000';
      colorPad.fillStyle = c;
      const onBlack = colorPad.fillStyle;
      colorPad.fillStyle = '#fff';
      colorPad.fillStyle = c;
      if (colorPad.fillStyle !== onBlack) return null; // the browser refused it
      colorPad.clearRect(0, 0, 1, 1);
      colorPad.fillStyle = onBlack;
      colorPad.fillRect(0, 0, 1, 1);
      const d = colorPad.getImageData(0, 0, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
    } catch (e) {
      return null; // canvas reading blocked: the raw string is still the truth
    }
  }

  const LEGACY_RGB = /^rgba?\(([^)]+)\)$/;

  // Always hex, with the opacity beside it the way a design tool writes it:
  // "#141414 4%" reads instantly, "rgba(20, 20, 20, 0.04)" does not.
  function toHex(color) {
    const hex = (x) => Math.round(x).toString(16).padStart(2, '0');
    const withAlpha = (base, a) => (a >= 1 ? base : a === 0 ? 'transparent' : base + ' ' + Math.round(a * 100) + '%');
    const legacy = LEGACY_RGB.exec(String(color).trim());
    // only the comma form is parsed here; space syntax goes to the canvas
    if (legacy && legacy[1].indexOf(',') >= 0) {
      const p = legacy[1].split(',').map((s) => parseFloat(s));
      const a = p.length > 3 ? p[3] : 1;
      return withAlpha(('#' + hex(p[0]) + hex(p[1]) + hex(p[2])).toUpperCase(), a);
    }
    const measured = colorRGBA(color);
    if (!measured) return color;
    if (measured.a === 0) return 'transparent';
    // read the colour again at full opacity: a nearly-transparent pixel cannot
    // report its own channels accurately
    const solid = colorRGBA(String(color).replace(/\s*\/\s*[\d.]+%?\s*\)\s*$/, ')')) || measured;
    return withAlpha(('#' + hex(solid.r) + hex(solid.g) + hex(solid.b)).toUpperCase(), measured.a);
  }

  // The bubble talks to a designer, so it says "#141414 4%". The copied card
  // talks to whoever edits the code, so it must stay valid CSS: hex when the
  // colour is opaque, the authored value untouched when it is not.
  function cssColor(color) {
    const shown = toHex(color);
    if (shown === 'transparent') return 'transparent';
    return /%$/.test(shown) ? String(color).trim() : shown;
  }

  function isTransparent(c) {
    if (!c || c === 'transparent') return true;
    const legacy = LEGACY_RGB.exec(String(c).trim());
    if (legacy && legacy[1].indexOf(',') >= 0) {
      const p = legacy[1].split(',').map((s) => parseFloat(s));
      return p.length > 3 && p[3] === 0;
    }
    const v = colorRGBA(c);
    return !!v && v.a === 0;
  }

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

  // Corner radius: one number when all four match, per-corner letters when they
  // differ, and null when there is none at all, which drops the row entirely.
  // A radius at or past half the element reads "full", because that is what a
  // pill or a circle means; the raw number there is meaningless, and a
  // Tailwind rounded-full computes to tens of millions of pixels.
  // The element's own layout box, free of any scaling a parent applies: a 20px
  // radius inside a scaled preview must not read as a pill.
  function layoutBox(el) {
    const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { width: 0, height: 0 };
    const w = typeof el.offsetWidth === 'number' && el.offsetWidth ? el.offsetWidth : r.width;
    const h = typeof el.offsetHeight === 'number' && el.offsetHeight ? el.offsetHeight : r.height;
    return { w, h };
  }

  // Computed lengths arrive divided by the page's zoom; this puts them back.
  const zoomOf = (el) => (el && typeof el.currentCSSZoom === 'number' ? el.currentCSSZoom : 1) || 1;

  function cornerValues(cs, el) {
    const { w, h } = layoutBox(el);
    const z = zoomOf(el);
    // per axis: the first length of a corner is horizontal, the second vertical
    const one = (v, cap) => {
      if (v.endsWith('%')) return parseFloat(v) >= 50 ? 'full' : v;
      const n = (parseFloat(v) || 0) * z;
      if (cap > 0 && n >= cap) return 'full';
      return String(Math.round(n));
    };
    const corner = (p) => {
      const raw = String(cs[p]).trim();
      // calc(), min(), clamp() with a percentage stay unresolved: print them
      // verbatim rather than shredding them on spaces
      if (raw.indexOf('(') >= 0) return raw;
      const parts = raw.split(/\s+/);
      if (parts.length === 1) return one(parts[0], Math.min(w, h) / 2);
      const a = one(parts[0], w / 2);
      const b = one(parts[1], h / 2);
      return a === b ? a : a + '/' + b;
    };
    return [
      ['TL', corner('borderTopLeftRadius')], ['TR', corner('borderTopRightRadius')],
      ['BR', corner('borderBottomRightRadius')], ['BL', corner('borderBottomLeftRadius')],
    ];
  }

  function cornerLabel(cs, el) {
    const vals = cornerValues(cs, el);
    const isZero = (v) => v === '0' || v === '0%';
    if (vals.every(([, v]) => isZero(v))) return null;
    if (vals.every(([, v]) => v === vals[0][1])) return 'Radius ' + vals[0][1];
    return 'Radius ' + vals.filter(([, v]) => !isZero(v)).map(([c, v]) => c + v).join(', ');
  }

  // Border, only when one is actually painted: width, style and colour, per
  // side when the sides disagree. A gradient border paints from an image and
  // reports a transparent colour, so the image is what gets named.
  function borderLabel(cs, el, fmt) {
    const paint = fmt || toHex;
    const z = zoomOf(el);
    const img = cs.borderImageSource;
    if (img && img !== 'none') {
      const w = Math.round((parseFloat(cs.borderTopWidth) || 0) * z);
      const shortImg = img.length > 120 ? img.slice(0, 120) + '…' : img;
      return (w ? w + 'px ' : '') + 'image ' + shortImg;
    }
    const read = (s) => ({
      side: s[0],
      w: Math.round((parseFloat(cs['border' + s + 'Width']) || 0) * z),
      style: cs['border' + s + 'Style'],
      color: cs['border' + s + 'Color'],
    });
    const all = ['Top', 'Right', 'Bottom', 'Left'].map(read);
    const shown = (b) => b.w > 0 && b.style !== 'none' && !isTransparent(b.color);
    const visible = all.filter(shown);
    if (!visible.length) return null;
    const one = (b) => b.w + 'px, ' + b.style + ', ' + paint(b.color);
    const uniform = all.every((b) => shown(b) && one(b) === one(all[0]));
    if (uniform) return one(all[0]);
    return visible.map((b) => b.side + ' ' + one(b)).join(' · ');
  }

  // Split a value list on its own commas, never on the ones inside rgb(...).
  function splitTop(value) {
    const out = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === ',' && depth === 0) { out.push(value.slice(start, i)); start = i + 1; }
    }
    out.push(value.slice(start));
    return out.map((s) => s.trim()).filter(Boolean);
  }

  // Shadows, written the way a person authors them: offsets first, colour last.
  // The browser reports colour first, which reads backwards to a designer.
  function shadowLabel(cs, fmt) {
    const paint = fmt || toHex;
    const raw = cs.boxShadow;
    if (!raw || raw === 'none') return null;
    const parts = [];
    for (const piece of splitTop(raw)) {
      const m = /^([a-z]+\([^)]*\)|#[0-9a-f]{3,8})\s+(.*)$/i.exec(piece);
      const color = m ? m[1] : '';
      const rest = (m ? m[2] : piece).replace(/\s+/g, ' ').trim();
      // Tailwind fills its unused shadow slots with transparent zero-size
      // shadows; they paint nothing, so they are not worth a designer's eye.
      if (color && isTransparent(color)) continue;
      const nums = rest.match(/-?[\d.]+/g);
      if (nums && nums.length && nums.every((n) => parseFloat(n) === 0)) continue;
      parts.push(m ? rest.split(' ').join(', ') + ', ' + paint(color) : piece);
    }
    if (!parts.length) return null;
    const shown = parts.slice(0, 2).join(' · ') + (parts.length > 2 ? ' · …' : '');
    return shown.length > 120 ? shown.slice(0, 120) + '…' : shown;
  }

  function fineLabel(v) {
    const n = parseFloat(v);
    if (Number.isNaN(n)) return String(v);
    return (Math.round(n * 100) / 100) + 'px';
  }

  // Sides in the owner's order, L R T B. A zero side is omitted; all-zero -> "0".
  function sidesLabel(cs, prop) {
    const read = (side) => Math.round(parseFloat(cs[prop + side]) || 0);
    const parts = [['L', read('Left')], ['R', read('Right')], ['T', read('Top')], ['B', read('Bottom')]]
      .filter(([, v]) => v !== 0)
      .map(([s, v]) => s + v);
    return parts.length ? parts.join(', ') : '0';
  }

  // ---------- the bubble ----------

  // What sits behind a colour on the page, so a see-through value can be shown
  // over its real backdrop instead of over the bubble's own blue.
  function backdropOf(el) {
    let n = el;
    for (let i = 0; n && i < 12; i++) {
      const c = getComputedStyle(n).backgroundColor;
      if (!isTransparent(c)) return c;
      n = n.parentElement;
    }
    return '#ffffff';
  }

  // Rows are collected first and only drawn when they differ from what is
  // already on screen: rebuilding on every mouse move made the numbers flicker.
  let pendingRows = [];
  let pendingGap = false;
  let drawnSignature = '';

  function row(text, swatch, base, style) {
    if (pendingGap) {
      // the row's own styling still wins, so the footer keeps its own margin
      style = Object.assign({ marginTop: GROUP_GAP }, style || {});
      pendingGap = false;
    }
    pendingRows.push({ text: text, swatch: swatch, base: base, style: style });
  }

  // A breath between groups. It waits for the next row that really prints, so
  // an empty group leaves no gap behind and two in a row never double up.
  function gap() {
    if (pendingRows.length) pendingGap = true;
  }

  function drawRows() {
    const signature = pendingRows.map((r) => r.text + '|' + (r.swatch || '')).join('\n');
    if (signature === drawnSignature) { pendingRows = []; return; }
    drawnSignature = signature;
    content.textContent = '';
    for (const r of pendingRows) {
      const div = document.createElement('div');
      div.textContent = r.text; // page data stays text, never markup
      Object.assign(div.style, {
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      });
      if (r.style) Object.assign(div.style, r.style);
      if (r.swatch) {
        const s = document.createElement('span');
        Object.assign(s.style, {
          display: 'inline-block', width: '12px', height: '12px',
          backgroundColor: r.base || '#ffffff',
          backgroundImage: 'linear-gradient(' + r.swatch + ', ' + r.swatch + ')',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          borderRadius: '2px', marginLeft: '8px', verticalAlign: '-1px',
        });
        div.appendChild(s);
      }
      content.appendChild(div);
    }
    pendingRows = [];
  }

  // Values in the bubble read like words a designer writes: Full, Normal, None.
  // Only whole lowercase words are lifted, so hex, units and CSS functions such
  // as linear-gradient() stay exactly as the browser wrote them. The copied
  // card never passes through here: its reader needs valid CSS.
  const capWords = (v) => v.replace(/(^|[\s,·\/])([a-z]+)(?=$|[\s,·\/])/g,
    (m, pre, w) => pre + w.charAt(0).toUpperCase() + w.slice(1));

  function fillBubble(el) {
    pendingRows = [];
    pendingGap = false;
    const cls = classesOf(el);
    row(tagLabel(el) + ' · ' + (cls || 'No class'));

    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const size = Math.round(r.width) + ' × ' + Math.round(r.height);
    const bg = cs.backgroundColor;
    const painted = !isTransparent(bg);
    // a see-through colour is shown over what the page really has behind it
    const behindEl = backdropOf(el.parentElement || el);
    const behindText = backdropOf(el);
    const bgRow = () => row('Bg: ' + capWords(toHex(bg)), bg, behindEl);
    // a zero side is not news: the row appears only when there is spacing
    const spacingRow = (label, prop) => {
      const v = sidesLabel(cs, prop);
      if (v !== '0') row(label + ': ' + v);
    };

    // Four groups, always in this order, separated by a breath: what it is,
    // how it reads, how it sits, how it looks. An empty group disappears.
    const kind = kindOf(el);
    // no background is not news either: the row appears only when one is painted
    let showBg = kind !== 'image' && painted;

    if (kind === 'text') {
      // the style of the words on screen, which on a wrapper lives in a child
      const t = textStyleSource(el);
      const tcs = t === el ? cs : getComputedStyle(t);
      gap();
      row(fontName(tcs.fontFamily));
      row(weightName(tcs.fontWeight) + ', ' + pxLabel(tcs.fontSize));
      // a line height nobody set says nothing: only a real one takes a row
      const lh = pxLabel(tcs.lineHeight);
      if (lh !== 'normal') row('L-H: ' + lh);
      if (tcs.letterSpacing && tcs.letterSpacing !== 'normal') {
        row('L-S: ' + fineLabel(tcs.letterSpacing));
      }
      row('Text: ' + capWords(toHex(tcs.color)), tcs.color, behindText);
    }

    gap();
    if (kind !== 'text') row(size);
    if (kind === 'box') spacingRow('Margin', 'margin');
    if (kind !== 'image') spacingRow('Padding', 'padding');

    gap();
    if (showBg) bgRow();
    const corners = cornerLabel(cs, el);
    if (corners) row(capWords(corners.replace(/^Radius /, 'Radius: ')));
    const border = borderLabel(cs, el);
    if (border) row('Border: ' + capWords(border));
    const shadow = shadowLabel(cs);
    if (shadow) row('Shadow: ' + capWords(shadow));
    row('Click to copy for your agent', null, null, { marginTop: '8px', color: FOOTER_COLOR });
    drawRows();
  }

  // ---------- placing ----------

  // Entrance: the bubble fades in when it appears, never on the moves after.
  // Skipped when the machine asks for reduced motion, where it just appears.
  let fadeAnim = null;
  let fadeGuard = 0;

  function endFade() {
    if (fadeGuard) { clearTimeout(fadeGuard); fadeGuard = 0; }
    if (fadeAnim) {
      try { fadeAnim.cancel(); } catch (e) { /* already gone */ }
      fadeAnim = null;
    }
  }

  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fadeInBubble() {
    if (typeof bubble.animate !== 'function') return;
    if (reducedMotion()) return;
    endFade();
    fadeAnim = bubble.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 56, easing: 'ease-out' });
    // A stalled animation clock must never leave the bubble invisible: dropping
    // the animation restores the element's own full opacity.
    fadeGuard = setTimeout(endFade, 400);
  }

  function place() {
    if (!target || !target.getBoundingClientRect) { hide(); return; }
    const r = target.getBoundingClientRect();
    Object.assign(box.style, {
      display: 'block',
      left: r.left + 'px', top: r.top + 'px',
      width: Math.max(0, r.width) + 'px', height: Math.max(0, r.height) + 'px',
    });
    const wasHidden = bubble.style.display === 'none';
    bubble.style.display = bubbleDisplay;
    if (wasHidden) fadeInBubble();
    const bh = bubble.offsetHeight;
    const bw = bubble.offsetWidth;
    const above = outTopEdge !== null ? outTopEdge : r.top;
    const below = outBottomEdge !== null ? outBottomEdge : r.bottom;
    // Above the element; else below it when that fits on screen; else pinned to
    // the top, which is where a taller-than-the-window element leaves it.
    let top = above - bh - 8;
    if (top < 4) {
      const under = below + 8;
      top = (under + bh <= innerHeight - 4) ? under : 4;
    }
    bubble.style.top = top + 'px';
    // The bubble rides the cursor's X, centered on it, clamped to the viewport.
    // To the cursor's right, so the cursor itself is never covered; flips to
    // its left only when the right side has no room.
    let left;
    if (lastX >= 0) {
      // the cursor lines up with the text's left edge, not the box's
      const padLeft = parseFloat(getComputedStyle(bubble).paddingLeft) || 0;
      left = lastX - padLeft;
      if (left + bw > innerWidth - 8) left = lastX - bw + padLeft;
    } else {
      left = r.left;
    }
    bubble.style.left = Math.max(4, Math.min(left, innerWidth - bw - 8)) + 'px';
  }

  const INSIDE_BAND = 'rgba(222, 180, 117, 0.32)';  // spaces between children
  const OUTSIDE_BAND = 'rgba(118, 161, 255, 0.32)'; // distances from the element outward

  function clearBands() {
    for (const b of bands) b.remove();
    bands.length = 0;
  }

  // Three layers, bottom to top: band rectangles, then their number pills, then
  // the bubble and highlight. Pills ride their own layer so a neighbouring
  // band's wash can never tint or cover a number.
  function addBand(geo, color) {
    const d = document.createElement('div');
    Object.assign(d.style, {
      position: 'fixed', zIndex: '2147483645', pointerEvents: 'none',
      left: geo.left + 'px', top: geo.top + 'px',
      width: geo.width + 'px', height: geo.height + 'px',
      background: color,
    });
    document.documentElement.appendChild(d);
    bands.push(d);

    const chip = document.createElement('div');
    chip.textContent = String(Math.round(geo.gap));
    Object.assign(chip.style, {
      position: 'fixed', zIndex: '2147483646', pointerEvents: 'none',
      left: (geo.left + geo.width / 2) + 'px', top: (geo.top + geo.height / 2) + 'px',
      transform: 'translate(-50%, -50%)',
      background: BUBBLE_BG, color: '#f3f4f6',
      font: "12px/1.4 'Google Sans', 'Product Sans', Roboto, Arial, sans-serif",
      padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
    });
    document.documentElement.appendChild(chip);
    bands.push(chip);
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
      addBand(geo, INSIDE_BAND);
    }
  }

  // Distances from the hovered element outward: up, down, left, right, each to
  // the first thing that direction meets. A touching neighbour means genuinely
  // zero and stays silent; a container wall that merely hugs the element makes
  // the measuring climb to the next container, so the band always reaches the
  // first edge the eye actually sees.
  function drawOutward(el) {
    outTopEdge = null;
    outBottomEdge = null;
    if (!el || el === document.documentElement || el === document.body) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const bandSet = new Set(bands);
    const rectsAround = (node) => [...node.parentElement.children]
      .filter((c) => c !== node && c !== box && c !== bubble && !bandSet.has(c) &&
        getComputedStyle(c).display !== 'none')
      .map((c) => c.getBoundingClientRect())
      .filter((s) => s.width > 0 && s.height > 0);
    const overlapX = (s) => Math.min(s.right, r.right) > Math.max(s.left, r.left);
    const overlapY = (s) => Math.min(s.bottom, r.bottom) > Math.max(s.top, r.top);

    const DIRS = [
      { wall: (p) => p.top, best: Math.max, dist: (e) => r.top - e,
        pick: (s) => (overlapX(s) && s.bottom <= r.top + 0.5) ? s.bottom : null,
        remember: (e) => { outTopEdge = e; },
        geo: (e) => ({ left: r.left, top: e, width: r.width, height: r.top - e, gap: r.top - e }) },
      { wall: (p) => p.bottom, best: Math.min, dist: (e) => e - r.bottom,
        pick: (s) => (overlapX(s) && s.top >= r.bottom - 0.5) ? s.top : null,
        remember: (e) => { outBottomEdge = e; },
        geo: (e) => ({ left: r.left, top: r.bottom, width: r.width, height: e - r.bottom, gap: e - r.bottom }) },
      { wall: (p) => p.left, best: Math.max, dist: (e) => r.left - e,
        pick: (s) => (overlapY(s) && s.right <= r.left + 0.5) ? s.right : null,
        geo: (e) => ({ left: e, top: r.top, width: r.left - e, height: r.height, gap: r.left - e }) },
      { wall: (p) => p.right, best: Math.min, dist: (e) => e - r.right,
        pick: (s) => (overlapY(s) && s.left >= r.right - 0.5) ? s.left : null,
        geo: (e) => ({ left: r.right, top: r.top, width: e - r.right, height: r.height, gap: e - r.right }) },
    ];

    for (const dir of DIRS) {
      let node = el;
      for (let climb = 0; climb < 6; climb++) {
        const parent = node.parentElement;
        if (!parent || parent === document.documentElement) break;
        let edge = dir.wall(parent.getBoundingClientRect());
        let touching = false;
        for (const s of rectsAround(node)) {
          const cand = dir.pick(s);
          if (cand === null) continue;
          if (dir.dist(cand) < 3) { touching = true; break; }
          edge = dir.best(edge, cand);
        }
        if (touching) break;
        if (dir.dist(edge) >= 3) {
          addBand(dir.geo(edge), OUTSIDE_BAND);
          if (dir.remember) dir.remember(edge);
          break;
        }
        node = parent; // the wall hugs the element: look one container further out
      }
    }
  }

  function paint() {
    if (!inspecting || !target) { hide(); return; }
    if (!flashTimer) fillBubble(target);
    drawBands(target);
    drawOutward(target);
    place(); // last, so the bubble can clear the bands it now knows about
  }

  function hide() {
    box.style.display = 'none';
    bubble.style.display = 'none';
    drawnSignature = '';
    unlockBubbleSize();
    clearBands();
  }

  // The confirmation panel wears the bubble the element's facts were wearing:
  // the box is pinned just before the swap and released when the facts come
  // back, so the bubble never resizes or moves under the cursor mid-copy.
  // Minimums, not fixed sizes, so a panel taller than a short bubble grows it
  // rather than spilling outside the rounded background.
  function lockBubbleSize() {
    if (bubble.style.minHeight) return;          // a flash already holds the box
    if (bubble.style.display === 'none') return; // nothing measurable to keep
    bubble.style.minWidth = bubble.offsetWidth + 'px';
    bubble.style.minHeight = bubble.offsetHeight + 'px';
  }

  function unlockBubbleSize() {
    bubble.style.minWidth = '';
    bubble.style.minHeight = '';
  }

  // Built node by node rather than as markup: a site with strict content rules
  // can refuse markup assignment, and this path never can be refused.
  function checkIcon() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'none');
    svg.style.flex = '0 0 auto';
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M3 12L7.33 17L16 3');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);
    return svg;
  }

  // The check mark from the design: a white ring with a white tick inside it.
  function checkDisc() {
    const disc = document.createElement('div');
    Object.assign(disc.style, {
      width: '36px', height: '36px', borderRadius: '999px',
      border: '2px solid #FFFFFF', boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto',
    });
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '36');
    svg.setAttribute('height', '36');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('fill', 'none');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', 'M11.25 20.25L16.5 25.88L24.75 10.69');
    path.setAttribute('stroke', '#FFFFFF');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    disc.appendChild(svg);
    return disc;
  }

  function copiedPanel(ok) {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    });
    if (ok) wrap.appendChild(checkDisc());
    const title = document.createElement('div');
    title.textContent = ok ? 'Specs copied!' : 'Failed, try again';
    Object.assign(title.style, {
      marginTop: ok ? '10px' : '0', fontSize: '16px', fontWeight: '500', color: '#FFFFFF',
    });
    wrap.appendChild(title);
    if (ok) {
      const sub = document.createElement('div');
      sub.textContent = 'Paste it to your agent';
      Object.assign(sub.style, { marginTop: '0', fontSize: '14px', color: '#BFC5E7' });
      wrap.appendChild(sub);
    }
    return wrap;
  }

  // Out: down 8px while fading, ease-in. In: up 8px while fading, ease-out.
  // Both 144ms, and the content is never left invisible if the clock stalls.
  const SWAP_MS = 144;

  function swapContent(build) {
    let settled = false;
    let fadeOut = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (fadeOut) { try { fadeOut.cancel(); } catch (e) { /* already gone */ } }
      // a build that says false has been overtaken: the bubble is not ours to touch
      if (build() === false) return;
      place();
      if (typeof content.animate === 'function' && !reducedMotion()) {
        const rise = content.animate(
          [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: SWAP_MS, easing: 'ease-out' }
        );
        // same guard as the fade-out: a stalled clock must not strand the
        // content at the rise's first frame, which is invisible.
        setTimeout(() => { try { rise.cancel(); } catch (e) { /* already gone */ } }, SWAP_MS + 300);
      }
    };
    if (typeof content.animate !== 'function' || reducedMotion()) { finish(); return; }
    fadeOut = content.animate(
      [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(8px)' }],
      { duration: SWAP_MS, easing: 'ease-in', fill: 'forwards' }
    );
    fadeOut.onfinish = finish;
    setTimeout(finish, SWAP_MS + 300);
  }

  function resetBubbleChrome() {
    bubbleDisplay = 'block';
    Object.assign(bubble.style, {
      background: BUBBLE_BG, padding: BUBBLE_PAD, borderRadius: BUBBLE_RADIUS,
      alignItems: '', justifyContent: '', gap: '',
    });
  }

  // Back from the confirmation to the element's facts, the same swap in reverse.
  function restoreFacts() {
    const gen = ++flashGen;
    flashTimer = -1; // the swap owns the bubble until the facts land
    swapContent(() => {
      if (gen !== flashGen) return false; // a newer click, or the key was released
      flashTimer = 0;
      drawnSignature = '';
      resetBubbleChrome();
      unlockBubbleSize();
      if (inspecting && target) fillBubble(target);
      else content.textContent = '';
    });
    if (!inspecting) hide();
  }

  // Moving to another element ends the confirmation early: the facts he is
  // looking at now beat the message about the one he just left.
  function endFlash() {
    if (flashTimer > 0) {
      clearTimeout(flashTimer);
      restoreFacts();
    }
  }

  // Both outcomes wear the same panel; only the words differ, and only the
  // success one carries the ring and its tick.
  function flash(ok) {
    if (flashTimer && flashTimer > 0) clearTimeout(flashTimer);
    const gen = ++flashGen;
    flashTimer = -1; // the panel owns the bubble from this instant, not from the swap
    lockBubbleSize();
    swapContent(() => {
      if (gen !== flashGen) return false; // a newer click, or the key was released
      drawnSignature = '';
      content.textContent = '';
      content.appendChild(copiedPanel(ok));
      // the panel is centred in the box the facts left behind, both ways
      bubbleDisplay = 'flex';
      Object.assign(bubble.style, { alignItems: 'center', justifyContent: 'center' });
      flashTimer = setTimeout(restoreFacts, 2400);
    });
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
    if (settleTimer) { clearTimeout(settleTimer); settleTimer = 0; }
    if (flashTimer) {
      if (flashTimer > 0) clearTimeout(flashTimer);
      flashTimer = 0;
      flashGen++;   // a swap still in the air must not put a panel in an empty bubble
      resetBubbleChrome();
    }
    hide();
  }

  function setArmed(on) {
    armed = !!on;
    if (!armed) stopInspect();
  }

  // ---------- the ID card ----------

  // The words a person can actually read, gathered node by node: markup text
  // and hidden labels are skipped, and a space is kept between children so two
  // sentences never fuse into a word that exists in no file.
  function visibleText(el) {
    let out = '';
    const walk = (node, depth) => {
      if (out.length > 400 || depth > 12) return;
      for (const child of node.childNodes) {
        if (child.nodeType === 3) {
          const t = child.nodeValue.replace(/\s+/g, ' ');
          if (t.trim()) out += (out && !/\s$/.test(out) ? ' ' : '') + t.trim() + ' ';
        } else if (child.nodeType === 1 && !isHiddenText(child)) {
          walk(child, depth + 1);
        }
        if (out.length > 400) return;
      }
    };
    walk(el, 0);
    return out.replace(/\s+/g, ' ').trim();
  }

  function ownWords(el, max) {
    const t = visibleText(el);
    if (!t) return '';
    const words = t.split(' ');
    const cut = words.slice(0, max).join(' ');
    const clipped = cut.length > 80 ? cut.slice(0, 80).trim() : cut;
    // a quote inside the excerpt would break the card's own quoting
    return clipped.replace(/"/g, "'") + (words.length > max || clipped !== cut ? ' …' : '');
  }

  function nameOf(el) {
    const cls = classesOf(el);
    return tagName(el) + (cls ? '.' + cls.split(' ')[0] : '');
  }

  function ordinal(n) {
    const r10 = n % 10;
    const r100 = n % 100;
    if (r10 === 1 && r100 !== 11) return n + 'st';
    if (r10 === 2 && r100 !== 12) return n + 'nd';
    if (r10 === 3 && r100 !== 13) return n + 'rd';
    return n + 'th';
  }

  // The element's source location, when the dev build stamped one: Lovable's
  // tagger attributes first, then generic inspector attributes, then React's
  // debug source on the fiber (dev builds before React 19). Walks a few
  // ancestors and says so when the stamp came from one. Null means unknown,
  // and unknown is never guessed.
  function sourceOf(el) {
    let node = el;
    for (let i = 0; node && i < 4; i++) {
      if (node.getAttribute) {
        const path = node.getAttribute('data-component-path');
        if (path) {
          const line = node.getAttribute('data-component-line');
          return path + (line ? ':' + line : '') + (node === el ? '' : ' (parent)');
        }
        const direct = node.getAttribute('data-lov-id') ||
          node.getAttribute('data-source') || node.getAttribute('data-inspector-location');
        if (direct) return direct + (node === el ? '' : ' (parent)');
      }
      for (const k in node) {
        if (k.indexOf('__reactFiber$') !== 0) continue;
        let f = node[k];
        for (let d = 0; f && d < 3; d++) {
          const s = f._debugSource;
          if (s && s.fileName) {
            const norm = String(s.fileName).replace(/\\/g, '/');
            const short = norm.indexOf('/src/') >= 0 ? 'src/' + norm.split('/src/').pop() : norm;
            return short + (s.lineNumber ? ':' + s.lineNumber : '') + (node === el ? '' : ' (parent)');
          }
          f = f.return;
        }
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  // Light or dark by what the page actually painted, never by the browser's
  // preference: a site with no dark mode renders light under a dark OS, and
  // the executor needs the truth the owner's eyes saw.
  function pageTheme() {
    const bgOf = (el) => {
      const c = getComputedStyle(el).backgroundColor;
      return isTransparent(c) ? null : c;
    };
    const c = bgOf(document.body) || bgOf(document.documentElement);
    if (!c) return 'light';
    const m = /rgba?\(([^)]+)\)/.exec(c);
    if (!m) return 'light';
    const p = m[1].split(',').map(parseFloat);
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) < 128 ? 'dark' : 'light';
  }

  // React 19 removed the source location from its fibers, so a modern dev build
  // has no file to give. The component NAME is still there, and it names the
  // file to open. Walks a few ancestors, marked when it came from one.
  function componentOf(el) {
    const nameOf = (type) => {
      if (!type) return '';
      if (typeof type === 'string') return '';          // a plain host element
      if (type.displayName) return String(type.displayName);
      if (type.name) return String(type.name);
      if (type.render) return nameOf(type.render);      // forwardRef
      if (type.type) return nameOf(type.type);          // memo
      return '';
    };
    let node = el;
    for (let up = 0; node && up < 4; up++) {
      for (const k in node) {
        if (k.indexOf('__reactFiber$') !== 0 && k.indexOf('__reactInternalInstance$') !== 0) continue;
        let f = node[k];
        for (let d = 0; f && d < 12; d++) {
          const name = nameOf(f.elementType || f.type);
          if (name && name.length < 60 && /^[A-Z]/.test(name)) {
            return name + (node === el ? '' : ' (parent)');
          }
          f = f.return;
        }
        break;
      }
      node = node.parentElement;
    }
    return null;
  }

  // How the element arranges its children, when it arranges them at all. The
  // classes only half-say this on Tailwind and say nothing on other stacks.
  function layoutOf(cs) {
    const d = cs.display;
    if (d !== 'flex' && d !== 'inline-flex' && d !== 'grid' && d !== 'inline-grid') return null;
    const parts = [];
    const isGrid = d.indexOf('grid') >= 0;
    if (isGrid) {
      parts.push(d);
      const cols = cs.gridTemplateColumns;
      if (cols && cols !== 'none' && cols !== 'subgrid') {
        // line names travel in brackets and are not tracks: [full-start] 100px …
        const tracks = cols.replace(/\[[^\]]*\]/g, ' ').trim().split(/\s+/).filter(Boolean);
        if (tracks.length) {
          const even = tracks.every((t) => t === tracks[0]);
          parts.push(even ? tracks.length + ' cols ' + tracks[0] : 'cols ' + tracks.join(', '));
        }
      }
    } else {
      const dir = cs.flexDirection;
      parts.push(d + ' ' + dir);
      if (cs.flexWrap && cs.flexWrap !== 'nowrap') parts.push(cs.flexWrap);
    }
    const gapRow = Math.round(parseFloat(cs.rowGap) || 0);
    const gapCol = Math.round(parseFloat(cs.columnGap) || 0);
    if (gapRow || gapCol) {
      parts.push('gap ' + (gapRow === gapCol ? gapRow + 'px' : gapRow + 'px/' + gapCol + 'px'));
    }
    if (cs.alignItems && cs.alignItems !== 'normal') parts.push('items ' + cs.alignItems);
    if (cs.justifyContent && cs.justifyContent !== 'normal') parts.push('justify ' + cs.justifyContent);
    return parts.join(', ');
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
      'page:    ' + location.pathname + location.search + location.hash,
      'element: ' + tagName(el) + (words ? ' · "' + words + '"' : ''),
      'classes: ' + (cls || '(none)'),
    ];
    if (chain.length || pos) {
      lines.push('inside:  ' + (chain.join(' > ') || '(page root)') + pos);
    }
    if (el.getBoundingClientRect) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const corners = cornerLabel(cs, el);
      lines.push('box:     ' + Math.round(r.width) + ' × ' + Math.round(r.height) +
        ' · margin ' + sidesLabel(cs, 'margin') + ' · padding ' + sidesLabel(cs, 'padding') +
        (corners ? ' · ' + corners.toLowerCase() : ''));
      const border = borderLabel(cs, el, cssColor);
      if (border) lines.push('border:  ' + border);
      const shadow = shadowLabel(cs, cssColor);
      if (shadow) lines.push('shadow:  ' + shadow);
      const layout = layoutOf(cs);
      if (layout) lines.push('layout:  ' + layout);
      const p = el.parentElement;
      if (p && p !== document.body && p !== document.documentElement && p.getBoundingClientRect) {
        const pr = p.getBoundingClientRect();
        const pcs = getComputedStyle(p);
        const pl = layoutOf(pcs);
        lines.push('parent:  ' + nameOf(p) + ' ' + Math.round(pr.width) + ' × ' + Math.round(pr.height) +
          ' · padding ' + sidesLabel(pcs, 'padding') + (pl ? ' · ' + pl : ''));
      }
      if (kindOf(el) === 'text') {
        const t = textStyleSource(el);
        const tcs = t === el ? cs : getComputedStyle(t);
        const type = [fontName(tcs.fontFamily), weightName(tcs.fontWeight), pxLabel(tcs.fontSize),
          'line-height ' + pxLabel(tcs.lineHeight)];
        if (tcs.letterSpacing && tcs.letterSpacing !== 'normal') {
          type.push('letter-spacing ' + fineLabel(tcs.letterSpacing));
        }
        type.push(cssColor(tcs.color));
        lines.push('type:    ' + type.join(', '));
      }
    }
    // one field per line is the card's contract: no page-written value may carry
    // a newline into it, and none may run away in length
    const flat = (v) => String(v).replace(/\s+/g, ' ').trim().slice(0, 120);
    const src = sourceOf(el);
    if (src) lines.push('file:    ' + flat(src));
    const comp = componentOf(el);
    if (comp) lines.push('comp:    ' + flat(comp));
    const handles = [];
    if (el.id) handles.push('id=' + flat(el.id));
    for (const a of ['data-testid', 'data-test', 'aria-label', 'name', 'role']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v) handles.push(a + '=' + flat(v));
    }
    if (handles.length) lines.push('attrs:   ' + handles.join(' · '));
    lines.push('view:    ' + innerWidth + ' × ' + innerHeight + ' · ' + pageTheme());
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

  // Crossing from one element to the next sweeps over the wrappers in between,
  // and reading each of them made several values flash by. A new element is
  // adopted only once the cursor has settled on it; the bubble keeps riding
  // the cursor meanwhile, so the delay is felt as steadiness, not lag.
  const SETTLE_MS = 60;

  function aimAt(el) {
    if (el === target) {
      if (settleTimer) { clearTimeout(settleTimer); settleTimer = 0; }
      return;
    }
    if (!target) { target = el; return; } // first element: no reason to wait
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      settleTimer = 0;
      target = el;
      endFlash();
      paint();
    }, SETTLE_MS);
  }

  document.addEventListener('mousemove', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    if (!inspecting) return;
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    if (el instanceof Element && el !== box && el !== bubble && !bubble.contains(el)) {
      aimAt(el);
    }
    paint();
  }, true);

  window.addEventListener('scroll', () => { if (inspecting) { drawBands(target); drawOutward(target); place(); } }, true);
  window.addEventListener('resize', () => { if (inspecting) { drawBands(target); drawOutward(target); place(); } }, true);

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
    copyText(idCard(pick)).then((ok) => flash(ok));
  }, true);

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'set-armed') setArmed(!!msg.armed);
    });
  }
})();
