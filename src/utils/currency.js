import { CURRENCY_SYMBOL } from './constants';

/**
 * Format a number as Indian Rupee currency string.
 * Uses safe integer math to avoid floating-point issues.
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted string like "₹1,25,000"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Safe addition for money values.
 * Rounds to 2 decimal places to avoid floating point drift.
 */
export function addMoney(a, b) {
  return Math.round((a + b) * 100) / 100;
}

/**
 * Safe subtraction for money values.
 */
export function subtractMoney(a, b) {
  return Math.round((a - b) * 100) / 100;
}

/**
 * Safe multiplication (qty * rate).
 */
export function multiplyMoney(a, b) {
  return Math.round(a * b * 100) / 100;
}

/**
 * Calculate discount.
 * @param {number} amount - Original amount
 * @param {number} discount - Discount value
 * @param {'fixed'|'percentage'} type - Discount type
 */
export function calculateDiscount(amount, discount, type = 'fixed') {
  if (type === 'percentage') {
    return Math.round(amount * discount) / 100;
  }
  return Math.min(discount, amount); // discount can't exceed amount
}

/**
 * Calculate tax amount.
 * @param {number} amount - Taxable amount
 * @param {number} rate - Tax rate percentage
 */
export function calculateTax(amount, rate) {
  return Math.round(amount * rate) / 100;
}
