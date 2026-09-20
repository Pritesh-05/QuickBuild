export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

export const watts = (value: number) => `${Math.round(value)}W`;

export const capacity = (mb: number) =>
  mb >= 1000 ? `${(mb / 1000).toFixed(mb % 1000 === 0 ? 0 : 1)} TB` : `${mb} GB`;

export const compact = (value: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(value);