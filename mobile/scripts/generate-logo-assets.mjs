import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets', 'images');
const src = path.join(assetsDir, 'logo-source.png');

const BG = '#060b28';

async function run() {
  const trimmed = await sharp(src).trim({ threshold: 40 }).toBuffer();

  const { data, info } = await sharp(trimmed)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Chroma-key: pixels that are light and near-grayscale become transparent.
  // The source has a light-gray background baked in (no real alpha), so we
  // detect low-saturation pixels and fade them out based on how "gray" they are.
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    if (max > 170 && chroma < 20) {
      if (max > 195 && chroma < 10) {
        data[i + 3] = 0;
      } else {
        const gray = Math.min(1, (max - 170) / 30);
        const flat = Math.min(1, (20 - chroma) / 15);
        const t = Math.pow(gray * flat, 0.6);
        data[i + 3] = Math.round(data[i + 3] * (1 - t));
      }
    }
  }

  const keyed = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();

  const size = Math.max(info.width, info.height);

  const squared = await sharp(keyed)
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp(squared)
    .resize(1024, 1024, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  await sharp(squared)
    .resize(700, 700, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 162,
      bottom: 162,
      left: 162,
      right: 162,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));

  await sharp(squared)
    .resize(700, 700, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 162,
      bottom: 162,
      left: 162,
      right: 162,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .grayscale()
    .png()
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));

  await sharp(squared)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));

  await sharp(squared)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));

  await sharp(squared)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(assetsDir, 'logo-mark.png'));

  console.log('generated: icon, adaptive fg/mono, splash, favicon, logo-mark');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
