/**
 * Compact SVG path data (svgo-style, no dependency): absolute or relative M/L/H/V/C/Q/A/Z → relative commands on a
 * fixed grid of `decimals`, shortest number formatting, implicit command repetition.
 * Rounding happens on absolute coordinates before differencing, so there is no cumulative drift.
 *
 * `factor` scales the geometry first (e.g. 0.25 to re-grid a 1000-unit drawing to 250 units for small sizes).
 *
 *   minPath('M499.1 233.4C494.5 235, 491.9 238.2, 490.5 244.1', 1) → 'M499.1 233.4c-4.6 1.6-7.2 4.8-8.6 10.7'
 */
function fmt(n, scale) {
  // n is an integer on the grid; scale = 10^decimals
  let s = String(n / scale);
  if (s.includes('e')) s = (n / scale).toFixed(Math.log10(scale));
  return s.replace(/^(-?)0\./, '$1.');
}

function join(nums) {
  let out = '';
  for (const s of nums) {
    if (!out) out = s;
    else if (s.startsWith('-')) out += s;
    else if (s.startsWith('.') && /\.\d*$/.test(out.split(/[ -]/).pop() ?? '')) out += s;
    else out += ' ' + s;
  }
  return out;
}

/** Parse any path (absolute or relative M/L/H/V/C/Q/Z) into absolute [cmd, ...coords] segments (M/L/C/Q/Z). */
function absolutize(d) {
  const tokens = d.match(/[MLHVCQAZmlhvcqaz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const N = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, A: 7, Z: 0 };
  const segs = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0;
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    const U = cmd.toUpperCase();
    const rel = cmd !== U;
    if (!(U in N)) throw new Error(`minPath: unsupported command ${cmd}`);
    if (U === 'Z') {
      segs.push(['Z']);
      x = sx;
      y = sy;
      continue;
    }
    const v = tokens.slice(i, i + N[U]).map(Number);
    i += N[U];
    if (U === 'H') segs.push(['L', (x = rel ? x + v[0] : v[0]), y]);
    else if (U === 'V') segs.push(['L', x, (y = rel ? y + v[0] : v[0])]);
    else if (U === 'A') {
      // rx ry rotation large-arc sweep x y — only the end point is a coordinate
      x = rel ? x + v[5] : v[5];
      y = rel ? y + v[6] : v[6];
      segs.push(['A', v[0], v[1], v[2], v[3], v[4], x, y]);
    } else {
      const abs = v.map((n, k) => (rel ? n + (k % 2 ? y : x) : n));
      segs.push([U, ...abs]);
      x = abs[abs.length - 2];
      y = abs[abs.length - 1];
      if (U === 'M') {
        sx = x;
        sy = y;
        cmd = rel ? 'l' : 'L'; // extra pairs after a moveto are linetos
      }
    }
  }
  return segs;
}

export function minPath(d, decimals = 1, factor = 1) {
  const scale = 10 ** decimals;
  const q = (v) => Math.round(v * factor * scale);
  let cx = 0, cy = 0, sx = 0, sy = 0;
  let prev = '';
  let out = '';
  for (const [cmd, ...raw] of absolutize(d)) {
    if (cmd === 'Z') {
      out += 'z';
      cx = sx;
      cy = sy;
      prev = 'z';
      continue;
    }
    if (cmd === 'A') {
      const [rx, ry, rot, la, sw] = raw;
      const ex = q(raw[5]), ey = q(raw[6]);
      const body = join([fmt(q(rx), scale), fmt(q(ry), scale), String(rot), String(la), String(sw), fmt(ex - cx, scale), fmt(ey - cy, scale)]);
      out += prev === 'a' ? (body.startsWith('-') ? body : ' ' + body) : 'a' + body;
      prev = 'a';
      cx = ex;
      cy = ey;
      continue;
    }
    const pts = [];
    for (let k = 0; k < raw.length; k += 2) pts.push([q(raw[k]), q(raw[k + 1])]);
    const end = pts[pts.length - 1];
    const rel = pts.flatMap(([x, y]) => [x - cx, y - cy]);
    let letter = cmd.toLowerCase();
    const nums = rel.map((v) => fmt(v, scale));
    if (letter === 'l' && rel[1] === 0) {
      letter = 'h';
      nums.splice(1, 1);
    } else if (letter === 'l' && rel[0] === 0) {
      letter = 'v';
      nums.splice(0, 1);
    }
    // implicit repetition: same letter (never after m, where extra pairs mean lineto)
    if (letter === prev && letter !== 'm') {
      const body = join(nums);
      out += body.startsWith('-') ? body : ' ' + body;
    } else out += (out === '' && letter === 'm' ? 'M' : letter) + join(nums); // absolute start: safe to concatenate
    prev = letter;
    [cx, cy] = end;
    if (cmd === 'M') {
      sx = cx;
      sy = cy;
    }
  }
  return out;
}
