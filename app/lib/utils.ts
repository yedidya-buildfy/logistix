import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0";

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  // Format based on decimal places
  if (rounded % 1 === 0) {
    // No decimals: x
    return rounded.toString();
  } else if ((rounded * 10) % 1 === 0) {
    // One decimal: x.x
    return rounded.toFixed(1);
  } else {
    // Two decimals: x.xx
    return rounded.toFixed(2);
  }
}
