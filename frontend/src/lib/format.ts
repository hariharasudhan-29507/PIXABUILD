/**
 * Indian Rupee (INR) currency formatter
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "Rs. 0";
  return `Rs. ${Math.round(amount).toLocaleString("en-IN")}`;
}
