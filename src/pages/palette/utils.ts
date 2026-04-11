import type { ColorFormat } from "@catppuccin/palette";

export const toRgb = (rgb: ColorFormat["rgb"]) => {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
};
export const toHsl = (hsl: ColorFormat["hsl"]) => {
  return `hsl(${Math.round(hsl.h)}deg, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
};
export const toOklch = (oklch: ColorFormat["oklch"]) => {
  return `oklch(${Math.round(oklch.l * 100)}%, ${Math.round(oklch.c * 100)}% ${Math.round(oklch.h)}deg)`;
};
