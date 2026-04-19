#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'images');

const BG0 = '#0f1535';
const BG1 = '#060b28';
const BRAND = '#4318ff';
const BRAND2 = '#9f7aea';
const CYAN = '#21d4fd';
const ACCENT = '#01b574';
const WHITE = '#ffffff';

function iconSvg({ size, withBackground = true, mono = false }) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const radius = s * 0.22;
  const bgRect = withBackground
    ? `<defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${BG0}" />
          <stop offset="100%" stop-color="${BG1}" />
        </linearGradient>
        <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${BRAND}" />
          <stop offset="60%" stop-color="${BRAND2}" />
          <stop offset="100%" stop-color="${CYAN}" />
        </linearGradient>
        <linearGradient id="server" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${WHITE}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${WHITE}" stop-opacity="0.78" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${s}" height="${s}" rx="${radius}" fill="url(#bg)" />
      <rect x="0" y="0" width="${s}" height="${s}" rx="${radius}" fill="url(#brand)" opacity="0.28" />`
    : `<defs>
        <linearGradient id="server" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${mono ? '#ffffff' : WHITE}" stop-opacity="${mono ? '1' : '0.95'}" />
          <stop offset="100%" stop-color="${mono ? '#ffffff' : WHITE}" stop-opacity="${mono ? '1' : '0.78'}" />
        </linearGradient>
      </defs>`;

  // Server rack icon + network pulse
  const rackW = s * 0.46;
  const rackH = s * 0.56;
  const rackX = cx - rackW / 2;
  const rackY = cy - rackH / 2;
  const unitH = rackH / 4;
  const pad = s * 0.018;
  const unitRx = s * 0.02;
  const ledR = s * 0.012;

  const strokeColor = mono ? '#ffffff' : WHITE;
  const ledOn = mono ? '#ffffff' : ACCENT;
  const ledAlt = mono ? '#ffffff' : CYAN;

  const units = [0, 1, 2, 3]
    .map((i) => {
      const y = rackY + i * unitH + pad;
      const h = unitH - pad * 2;
      return `
        <rect x="${rackX + pad}" y="${y}" width="${rackW - pad * 2}" height="${h}" rx="${unitRx}" fill="url(#server)" opacity="${mono ? 1 : 0.14}" stroke="${strokeColor}" stroke-width="${s * 0.006}" />
        <circle cx="${rackX + pad + s * 0.035}" cy="${y + h / 2}" r="${ledR}" fill="${i % 2 === 0 ? ledOn : ledAlt}" opacity="${mono ? 1 : 1}" />
        <circle cx="${rackX + pad + s * 0.06}" cy="${y + h / 2}" r="${ledR}" fill="${i % 2 === 0 ? ledAlt : ledOn}" opacity="${mono ? 0.6 : 0.85}" />
        <rect x="${rackX + rackW - pad - s * 0.08}" y="${y + h / 2 - s * 0.005}" width="${s * 0.06}" height="${s * 0.01}" rx="${s * 0.004}" fill="${strokeColor}" opacity="${mono ? 1 : 0.5}" />
      `;
    })
    .join('');

  const frame = `<rect x="${rackX}" y="${rackY}" width="${rackW}" height="${rackH}" rx="${s * 0.035}" fill="none" stroke="${strokeColor}" stroke-width="${s * 0.012}" opacity="${mono ? 1 : 0.9}" />`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${bgRect}
  ${frame}
  ${units}
</svg>`;
}

function splashSvg({ width, height }) {
  const cx = width / 2;
  const cy = height / 2;
  const iconSize = Math.min(width, height) * 0.28;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.35" />
      <stop offset="60%" stop-color="${BG1}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="${BG1}" />
  <circle cx="${cx}" cy="${cy}" r="${Math.min(width, height) * 0.55}" fill="url(#glow)" />
  <g transform="translate(${cx - iconSize / 2}, ${cy - iconSize / 2})">
    ${iconSvg({ size: iconSize, withBackground: true }).replace(/<\?xml[^>]*\?>\s*/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}
  </g>
</svg>`;
}

async function writePng(svg, outPath, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log('wrote', path.relative(ROOT, outPath));
}

async function main() {
  if (!fs.existsSync(IMG)) fs.mkdirSync(IMG, { recursive: true });

  // Main app icon (1024x1024) — with dark background
  await writePng(iconSvg({ size: 1024, withBackground: true }), path.join(IMG, 'icon.png'), 1024, 1024);

  // Favicon (48x48)
  await writePng(iconSvg({ size: 1024, withBackground: true }), path.join(IMG, 'favicon.png'), 48, 48);

  // Android adaptive icon: foreground (432x432 logical, 1024 px) — no bg, padded
  await writePng(iconSvg({ size: 1024, withBackground: false }), path.join(IMG, 'android-icon-foreground.png'), 1024, 1024);

  // Android adaptive background — solid dark gradient
  const bgSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG0}" />
      <stop offset="100%" stop-color="${BG1}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" fill="url(#bg)" />
</svg>`;
  await writePng(bgSvg, path.join(IMG, 'android-icon-background.png'), 1024, 1024);

  // Monochrome icon (white-only, transparent bg) for themed icons on Android 13+
  await writePng(iconSvg({ size: 1024, withBackground: false, mono: true }), path.join(IMG, 'android-icon-monochrome.png'), 1024, 1024);

  // Splash icon (1242x2436 -> just a square icon since app.json uses resizeMode contain with width 200)
  await writePng(iconSvg({ size: 1024, withBackground: true }), path.join(IMG, 'splash-icon.png'), 1024, 1024);

  console.log('all assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
