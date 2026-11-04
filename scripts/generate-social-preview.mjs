import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Build a dedicated 1200×630 share card from the ACTUAL Mộc Châu hero image.
// Do not crop the hero: all text is already drawn into its left edge. Facebook
// may scale/crop thumbnails, so the hero sits inside a generous safe border.
const root = process.cwd();
const output = path.join(root, 'public', 'og-mocchau-1200x630.jpg');
const hero = path.join(root, 'public', 'mocchau-hero-v5.jpg');
const width = 1200, height = 630;
const photoWidth = 1050, photoHeight = 372;
const background = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#103c30"/>
      <stop offset="100%" stop-color="#082d24"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="75" y="80" font-family="DejaVu Sans, Noto Sans, sans-serif" font-weight="bold" font-size="38" fill="#f4fff6">MỘC CHÂU TRAVEL</text>
  <circle cx="569" cy="66" r="4" fill="#7ce6b1"/>
  <text x="591" y="77" font-family="DejaVu Sans, Noto Sans, sans-serif" font-size="25" fill="#82efbb">QT LIMOUSINE</text>
  <text x="75" y="559" font-family="DejaVu Sans, Noto Sans, sans-serif" font-size="30" font-weight="bold" fill="#f4fff6">HÀ NỘI  ↔  MỘC CHÂU</text>
  <text x="75" y="601" font-family="DejaVu Sans, Noto Sans, sans-serif" font-size="21" fill="#a5dbc0">Đặt xe · Khám phá · Cẩm nang du lịch</text>
</svg>`;

const actualPhoto = await sharp(hero)
  .resize(photoWidth, photoHeight, { fit: 'contain', background: '#103c30' })
  .jpeg({ quality: 90 })
  .toBuffer();

await mkdir(path.dirname(output), { recursive: true });
await sharp(Buffer.from(background))
  .composite([{ input: actualPhoto, left: 75, top: 125 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(output);

const metadata = await sharp(output).metadata();
if (metadata.width !== width || metadata.height !== height) {
  throw new Error('Invalid Open Graph image dimensions');
}
console.log('Generated safe-area social preview:', output);
