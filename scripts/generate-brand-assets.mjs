// Build-time derivatives of the approved Xe Đi Mộc Châu icon.
// Keep the approved source in public/brand-xedimocchau-icon-192.png;
// generate platform sizes without changing other public assets.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "public/brand-xedimocchau-icon-192.png");
const png = await readFile(source);
const meta = await sharp(png).metadata();
if (meta.width !== 192 || meta.height !== 192) {
  throw new Error("Brand source icon must be 192×192.");
}

async function writePng(name, size) {
  const bytes = await sharp(png)
    .resize(size, size, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 9, effort: 9 })
    .toBuffer();
  await writeFile(resolve(root, "public", name), bytes);
  return bytes;
}

// PWA/install sizes. Keeping the original 192px file avoids an extra lossy resize.
await writePng("brand-xedimocchau-icon-512.png", 512);
await writePng("brand-xedimocchau-apple-touch.png", 180);
await writePng("brand-xedimocchau-icon-32.png", 32);
await writePng("brand-xedimocchau-icon-16.png", 16);

const sizes = [16, 32, 48];
const entries = await Promise.all(sizes.map(size =>
  sharp(png).resize(size, size).png().toBuffer()
));
const ico = Buffer.alloc(6 + 16 * entries.length + entries.reduce((sum, item) => sum + item.length, 0));
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(entries.length, 4);
let dataOffset = 6 + 16 * entries.length;
entries.forEach((data, index) => {
  const entryOffset = 6 + 16 * index;
  ico[entryOffset] = sizes[index];
  ico[entryOffset + 1] = sizes[index];
  ico.writeUInt16LE(1, entryOffset + 4);
  ico.writeUInt16LE(32, entryOffset + 6);
  ico.writeUInt32LE(data.length, entryOffset + 8);
  ico.writeUInt32LE(dataOffset, entryOffset + 12);
  data.copy(ico, dataOffset);
  dataOffset += data.length;
});
await writeFile(resolve(root, "public/brand-xedimocchau-favicon.ico"), ico);
console.log("Generated Xe Đi Mộc Châu favicon, app icon, and Apple touch icon.");
