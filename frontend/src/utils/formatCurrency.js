const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export default function formatCurrency(amount) {
  const numericAmount = Number(amount);
  return inrFormatter.format(Number.isFinite(numericAmount) ? numericAmount : 0);
}
