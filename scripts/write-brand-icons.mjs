/**
 * Writes static brand icons (no ImageResponse): favicon.ico, icon.png, apple-touch-icon.png.
 * Run: node scripts/write-brand-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

const bg = { r: 0x1a, g: 0x47, b: 0x31 };
const letterB = [
  "011110",
  "010001",
  "010001",
  "011110",
  "010001",
  "010001",
  "011110",
];

function pixelFromLetter(ch) {
  if (ch === "1") return { r: 0xff, g: 0xff, b: 0xff, a: 0xff };
  return { ...bg, a: 0xff };
}

/** Colour at normalised template coords (16×16 grid). */
function colorAt16(tx, ty) {
  const W = 16;
  const H = 16;
  const ox = Math.floor((W - 6) / 2);
  const oy = Math.floor((H - 7) / 2);
  let px = { ...bg, a: 0xff };
  const ly = ty - oy;
  const lx = tx - ox;
  if (ly >= 0 && ly < 7 && lx >= 0 && lx < 6) {
    const row = letterB[ly];
    const ch = row[lx];
    px = pixelFromLetter(ch);
  }
  return px;
}

function rgbaAt(x, y, outW, outH) {
  const tx = Math.min(15, Math.max(0, Math.floor((x / outW) * 16)));
  const ty = Math.min(15, Math.max(0, Math.floor((y / outH) * 16)));
  return colorAt16(tx, ty);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(typeStr, data) {
  const type = Buffer.from(typeStr, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
  return Buffer.concat([len, type, data, crcBuf]);
}

function writePng(outPath, width, height) {
  const rows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const { r, g, b, a } = rgbaAt(x, y, width, height);
      row[1 + x * 4] = r;
      row[1 + x * 4 + 1] = g;
      row[1 + x * 4 + 2] = b;
      row[1 + x * 4 + 3] = a;
    }
    rows.push(row);
  }
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const png = Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${path.relative(root, outPath)}`);
}

function writeIco16(outPath) {
  const W = 16;
  const H = 16;
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
        px = pixelFromLetter(ch);
      }
      const o = rowOff + x * 4;
      xor[o] = px.b;
      xor[o + 1] = px.g;
      xor[o + 2] = px.r;
      xor[o + 3] = 0xff;
    }
  }

  const iconDir = Buffer.alloc(6);
  iconDir.writeUInt16LE(0, 0);
  iconDir.writeUInt16LE(1, 2);
  iconDir.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = W;
  entry[1] = H;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(dibSize, 8);
  entry.writeUInt32LE(6 + 16, 12);

  const dib = Buffer.concat([bmpHeader, xor, Buffer.alloc(andSize)]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.concat([iconDir, entry, dib]));
  console.log(`Wrote ${path.relative(root, outPath)}`);
}

writeIco16(path.join(publicDir, "favicon.ico"));
writePng(path.join(publicDir, "icon.png"), 48, 48);
writePng(path.join(publicDir, "apple-touch-icon.png"), 180, 180);
