/**
 * Writes public/favicon.ico — solid brand tile + “B” (16×16), ICO + BMP DIB.
 * Run: node scripts/write-favicon-ico.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outPath = path.join(root, "public", "favicon.ico");

const W = 16;
const H = 16;
const bg = { r: 0x1a, g: 0x47, b: 0x31 };
/** Rough 5×7 “B” bitmap, left column + bumps */
const letterB = [
  "011110",
  "010001",
  "010001",
  "011110",
  "010001",
  "010001",
  "011110",
];

function pixel(ch, x, y) {
  if (ch === "1") return { r: 0xff, g: 0xff, b: 0xff };
  return bg;
}

const rowStride = ((W * 32 + 31) >> 5) * 4;
const xorSize = rowStride * H;
const andRowStride = ((W + 31) >> 5) * 4;
const andSize = andRowStride * H;
const dibSize = 40 + xorSize + andSize;

const bmpHeader = Buffer.alloc(40);
bmpHeader.writeUInt32LE(40, 0);
bmpHeader.writeInt32LE(W, 4);
bmpHeader.writeInt32LE(H * 2, 8);
bmpHeader.writeUInt16LE(1, 12);
bmpHeader.writeUInt16LE(32, 14);
bmpHeader.writeUInt32LE(0, 16);
bmpHeader.writeUInt32LE(xorSize + andSize, 20);

const xor = Buffer.alloc(xorSize);
const ox = Math.floor((W - 6) / 2);
const oy = Math.floor((H - 7) / 2);
for (let y = 0; y < H; y++) {
  const rowOff = (H - 1 - y) * rowStride;
  for (let x = 0; x < W; x++) {
    let px = bg;
    const ly = y - oy;
    const lx = x - ox;
    if (ly >= 0 && ly < 7 && lx >= 0 && lx < 6) {
      const row = letterB[ly];
      const ch = row[lx];
      px = pixel(ch, x, y);
    }
    const o = rowOff + x * 4;
    xor[o] = px.b;
    xor[o + 1] = px.g;
    xor[o + 2] = px.r;
    xor[o + 3] = 0xff;
  }
}

const andMask = Buffer.alloc(andSize);

const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0);
iconDir.writeUInt16LE(1, 2);
iconDir.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry[0] = W >= 256 ? 0 : W;
entry[1] = H >= 256 ? 0 : H;
entry[2] = 0;
entry[3] = 0;
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(dibSize, 8);
entry.writeUInt32LE(6 + 16, 12);

const dib = Buffer.concat([bmpHeader, xor, andMask]);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.concat([iconDir, entry, dib]));
console.log(`Wrote ${path.relative(root, outPath)}`);
