#!/usr/bin/env node
/**
 * Count distinct design values in components/ and app/ for Task 3 baseline.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(p);
  }
  return out;
}

const files = [...walk("components"), ...walk("app"), "app/globals.css", "lib/ui/classes.ts"].filter(
  (f) => !f.includes("node_modules"),
);

const patterns = {
  fontSize: /text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|\[[^\]]+\])/g,
  fontWeight: /font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g,
  spacing: /(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-[xy])-(?:\[[^\]]+\]|\d+(?:\.\d+)?)/g,
  radius: /rounded(?:-[a-z0-9\[\]/]+)?/g,
  greenHex: /#[0-9a-fA-F]{3,8}/g,
  greenVar: /var\(--(?:brand|btn|header|nav)[^)]+\)/g,
};

const sets = Object.fromEntries(Object.keys(patterns).map((k) => [k, new Set()]));

for (const file of files) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const [key, re] of Object.entries(patterns)) {
    const matches = src.match(re);
    if (matches) matches.forEach((m) => sets[key].add(m));
  }
}

console.log("=== Design scale audit (distinct values) ===");
for (const [key, set] of Object.entries(sets)) {
  console.log(`\n${key}: ${set.size} distinct`);
  [...set].sort().slice(0, 30).forEach((v) => console.log(`  ${v}`));
  if (set.size > 30) console.log(`  ... +${set.size - 30} more`);
}
