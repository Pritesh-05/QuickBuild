export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

/** Spreads a price into a realistic low–high street-price band instead of
 * a single exact figure (retailers rarely agree on one number), rounded to
 * clean ₹ steps so the range doesn't look artificially precise. */
export const priceRange = (value: number, spread = 0.12): [number, number] => {
  const step = value >= 10000 ? 100 : value >= 1000 ? 50 : 10;
  const low = Math.floor(((value * (1 - spread)) / step)) * step;
  const high = Math.ceil(((value * (1 + spread)) / step)) * step;
  return [Math.max(low, 0), high];
};

export const currencyRangeText = (value: number, spread = 0.12) => {
  const [low, high] = priceRange(value, spread);
  return `${currency(low)} – ${currency(high)}`;
};

export const watts = (value: number) => `${Math.round(value)}W`;

export const capacity = (mb: number) =>
  mb >= 1000 ? `${(mb / 1000).toFixed(mb % 1000 === 0 ? 0 : 1)} TB` : `${mb} GB`;

export const compact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);