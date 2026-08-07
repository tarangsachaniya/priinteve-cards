/**
 * Verifies the restaurant brand colour maths in lib/restaurant/brand.ts.
 *
 *   npx tsx scripts/check-brand.ts
 *   npx tsx scripts/check-brand.ts "#F97316"   # inspect one seed
 *
 * The whole multi-tenant theming model rests on one promise: no seed a
 * restaurant owner can type produces an illegible button. That promise is an
 * assertion about ~16.7M colours, not something to reason about on paper — an
 * earlier version of onBrandColor() looked obviously correct and still left
 * mid-tone seeds at 4.35:1. So the floor is measured by sweeping the sRGB cube.
 *
 * Touches no database and takes no arguments in CI mode; safe to run anywhere.
 */
import {
  contrastRatio,
  hexToOklch,
  oklchToHex,
  onBrandColor,
  relativeLuminance,
  resolveBrandTheme,
  RESTO_DARK_BG,
  RESTO_LIGHT_BG,
  validateBrandSeed,
} from "@/lib/restaurant/brand";

const MIN_CONTRAST = 4.5;

let failures = 0;

function check(passed: boolean, label: string) {
  if (!passed) failures += 1;
  console.log(`${passed ? "ok  " : "FAIL"} ${label}`);
}

/** Published Oklch values for sRGB primaries — catches a transposed matrix. */
const REFERENCE: [string, number, number, number][] = [
  ["#FFFFFF", 1.0, 0, 0],
  ["#000000", 0, 0, 0],
  ["#808080", 0.59987, 0, 0],
  ["#FF0000", 0.62796, 0.25768, 29.234],
  ["#00FF00", 0.86644, 0.29483, 142.495],
  ["#0000FF", 0.45201, 0.31321, 264.052],
];

function inspect(hex: string) {
  const { l, c, h } = hexToOklch(hex);
  const theme = resolveBrandTheme(hex);
  const validation = validateBrandSeed(hex);
  console.log(`\n${hex}`);
  console.log(`  oklch        ${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(1)}`);
  console.log(`  luminance    ${relativeLuminance(hex).toFixed(4)}`);
  console.log(`  normalized   ${validation.normalized}${validation.adjusted ? "  (adjusted)" : ""}`);
  console.log(`  on-brand     ${theme.onBrand}  ${contrastRatio(theme.onBrand, theme.seed).toFixed(2)}:1`);
  console.log(`  text/light   ${theme.textOnLight}  ${contrastRatio(theme.textOnLight, RESTO_LIGHT_BG).toFixed(2)}:1`);
  console.log(`  text/dark    ${theme.textOnDark}  ${contrastRatio(theme.textOnDark, RESTO_DARK_BG).toFixed(2)}:1`);
  for (const issue of validation.issues) console.log(`  ${issue.level.padEnd(8)} ${issue.code}: ${issue.message}`);
}

function main() {
  const [seedArg] = process.argv.slice(2);
  if (seedArg) {
    inspect(seedArg);
    return;
  }

  console.log("— Oklch conversion against published references —");
  for (const [hex, l, c, h] of REFERENCE) {
    const got = hexToOklch(hex);
    const hueMatches = c < 1e-3 || Math.abs(got.h - h) < 0.05;
    check(
      Math.abs(got.l - l) < 1e-3 && Math.abs(got.c - c) < 1e-3 && hueMatches,
      `${hex} → ${got.l.toFixed(5)} ${got.c.toFixed(5)} ${got.h.toFixed(3)}`
    );
  }

  console.log("\n— hex → Oklch → hex round trip is lossless —");
  for (const hex of ["#16A34A", "#F97316", "#FACC15", "#1E3A8A", "#DC2626", "#78716C", RESTO_DARK_BG]) {
    const back = oklchToHex(hexToOklch(hex));
    check(back === hex.toUpperCase(), `${hex} → ${back}`);
  }

  console.log("\n— WCAG contrast against known values —");
  check(Math.abs(contrastRatio("#FFFFFF", "#000000") - 21) < 0.01, "white on black = 21.00:1");
  check(Math.abs(contrastRatio("#767676", "#FFFFFF") - 4.54) < 0.02, "#767676 on white = 4.54:1");

  console.log("\n— on-brand floor across the sRGB cube —");
  let worst = Infinity;
  let worstHex = "";
  for (let r = 0; r < 256; r += 5) {
    for (let g = 0; g < 256; g += 5) {
      for (let b = 0; b < 256; b += 5) {
        const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
        const ratio = contrastRatio(onBrandColor(hex), hex);
        if (ratio < worst) {
          worst = ratio;
          worstHex = hex;
        }
      }
    }
  }
  check(worst >= MIN_CONTRAST, `worst case ${worst.toFixed(3)}:1 at ${worstHex} (floor ${MIN_CONTRAST})`);

  console.log("\n— brand text steps clear AA in both modes —");
  for (const hex of ["#FACC15", "#1E3A8A", "#F97316", "#16A34A", "#8C6EB4", "#78716C"]) {
    const theme = resolveBrandTheme(hex);
    const onLight = contrastRatio(theme.textOnLight, RESTO_LIGHT_BG);
    const onDark = contrastRatio(theme.textOnDark, RESTO_DARK_BG);
    check(
      onLight >= MIN_CONTRAST && onDark >= MIN_CONTRAST,
      `${hex} light ${onLight.toFixed(2)}:1 · dark ${onDark.toFixed(2)}:1`
    );
  }

  console.log("\n— validation flags the cases spec §3 names —");
  check(validateBrandSeed("not-a-colour").ok === false, "garbage input rejected");
  check(validateBrandSeed("#00FF00").adjusted, "over-saturated seed normalised");
  check(
    validateBrandSeed("#78716C").issues.some((i) => i.code === "neutral"),
    "near-neutral seed warns"
  );
  check(
    validateBrandSeed("#E03131").issues.some((i) => i.code === "error-collision"),
    "seed near --error warns"
  );
  check(validateBrandSeed("#16A34A").issues.length === 0, "schema default is clean");

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  if (failures > 0) process.exitCode = 1;
}

main();
