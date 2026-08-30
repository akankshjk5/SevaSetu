/**
 * Guards the language layer:
 *  - every t("...") key used in the app exists in the English pack
 *  - Hindi and Kannada packs define no key English does not have
 *  - every placeholder in a translation also appears in the English string
 * Run with: npm run check:i18n
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import en from "../src/i18n/dictionaries/en";
import hi from "../src/i18n/dictionaries/hi";
import kn from "../src/i18n/dictionaries/kn";

const enKeys = new Set(Object.keys(en));
let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.log(`FAIL  ${msg}`);
};

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

// Literal keys only — template keys like `cat.${id}` are checked by prefix below.
const files = walk("src");
const usedLiteral = new Set<string>();
const usedPrefix = new Set<string>();

for (const file of files) {
  const src = readFileSync(file, "utf8");
  // `<` only appears in documentation examples such as t("cat.<id>").
  for (const m of src.matchAll(/\bt\(\s*"([^"`$]+)"/g)) if (!m[1].includes("<")) usedLiteral.add(m[1]);
  for (const m of src.matchAll(/\bt\(\s*`([^`]*)\$\{/g)) usedPrefix.add(m[1]);
}

for (const key of usedLiteral) {
  if (!enKeys.has(key)) fail(`key used in code but missing from English pack: ${key}`);
}
for (const prefix of usedPrefix) {
  if (!prefix) continue;
  const any = [...enKeys].some((k) => k.startsWith(prefix));
  if (!any) fail(`template key prefix has no English entries: ${prefix}*`);
}

const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort().join(",");

for (const [name, pack] of [
  ["hi", hi],
  ["kn", kn],
] as const) {
  const keys = Object.keys(pack);
  for (const k of keys) {
    if (!enKeys.has(k)) fail(`${name} defines a key English does not: ${k}`);
    else {
      const enPlace = placeholders((en as Record<string, string>)[k]);
      const trPlace = placeholders((pack as Record<string, string>)[k]!);
      if (enPlace !== trPlace) fail(`${name} placeholder mismatch on ${k}: en(${enPlace}) vs ${name}(${trPlace})`);
    }
  }
  const coverage = Math.round((keys.length / enKeys.size) * 100);
  console.log(`INFO  ${name}: ${keys.length}/${enKeys.size} keys translated (${coverage}%)`);
}

console.log(
  failures === 0 ? `\nAll i18n checks passed (${enKeys.size} keys, ${usedLiteral.size} used literally).` : `\n${failures} i18n check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
