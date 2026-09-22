export const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

/** Spreads a price into a realistic low–high street-price band instead of
 * a single exact figure (retailers rarely agree on one number). Every part
 * gets the exact same ±spread percentage — rounding is always to the
 * nearest ₹10, regardless of price tier, so the spread never drifts wider
 * or narrower between cheap and expensive parts. */
export const priceRange = (value: number, spread = 0.1): [number, number] => {
  const round10 = (n: number) => Math.round(n / 10) * 10;
  const low = Math.max(round10(value * (1 - spread)), 0);
  const high = round10(value * (1 + spread));
  return [low, high];
};

export const currencyRangeText = (value: number, spread = 0.1) => {
  const [low, high] = priceRange(value, spread);
  return `${currency(low)} – ${currency(high)}`;
};

export const watts = (value: number) => `${Math.round(value)}W`;

export const capacity = (mb: number) =>
  mb >= 1000 ? `${(mb / 1000).toFixed(mb % 1000 === 0 ? 0 : 1)} TB` : `${mb} GB`;

export const compact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
