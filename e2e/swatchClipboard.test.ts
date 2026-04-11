// TODO: Fix test

import { flavors, type ColorFormat } from "@catppuccin/palette";
import { test, expect } from "@playwright/test";

const color = flavors.latte.colors.mauve;

// Copied from src/pages/palette/index.astro
const toRgb = (rgb: ColorFormat["rgb"]) => {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};
const toHsl = (hsl: ColorFormat["hsl"]) => {
  return `hsl(${Math.round(hsl.h)}deg, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
};
const toOklch = (oklch: ColorFormat["oklch"]) => {
  return `oklch(${Math.round(oklch.l * 100)}%, ${Math.round(oklch.c * 100)}% ${Math.round(oklch.h)}deg)`;
};

// derived from https://stackoverflow.com/questions/72265518/how-to-access-the-clipboard-contents-using-playwright-in-typescript
test("copy hex swatch", async ({ page, context }) => {
  await page.goto("/palette");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByText(color.hex).click();

  const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
  const clipboardContent = await handle.jsonValue();

  expect(clipboardContent).toBe(color.hex);
});

test("copy rgb swatch", async ({ page, context }) => {
  await page.goto("/palette");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByText(toRgb(color.rgb)).click();

  const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
  const clipboardContent = await handle.jsonValue();

  expect(clipboardContent).toBe(toRgb(color.rgb));
});

test("copy hsl swatch", async ({ page, context }) => {
  await page.goto("/palette");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByText(toHsl(color.hsl)).click();

  const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
  const clipboardContent = await handle.jsonValue();

  expect(clipboardContent).toBe(toHsl(color.hsl));
});

test("copy oklch swatch", async ({ page, context }) => {
  await page.goto("/palette");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.getByText(toOklch(color.oklch)).click();

  const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
  const clipboardContent = await handle.jsonValue();

  expect(clipboardContent).toBe(toOklch(color.oklch));
});
