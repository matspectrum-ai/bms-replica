// src/utils/format.js — Brazilian formatting utilities
// Source: RECON.md §5.9 (fmtCNPJ, fmtMoney, fmtDate, formatBRPhone, calcAnos)
// Matches original function signatures exactly per D-04.
//
// All functions are PURE — no side effects, no DOM access, no localStorage.
// These are the formatting workhorses used across every view in the application.

/**
 * Formats CNPJ digits to ##.###.###/####-##.
 * Strips non-digits, pads to 14, truncates to 14, applies mask.
 * @param {string} c - Raw CNPJ digits (may include formatting characters)
 * @returns {string} Formatted CNPJ: ##.###.###/####-## (always 18 chars)
 */
export function fmtCNPJ(c) {
  const d = (c || '').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formats number as Brazilian Real currency.
 * Uses pt-BR locale: R$ X.XXX,XX
 * @param {number|string|null|undefined} v - Value to format
 * @returns {string} Formatted BRL string, '—' if null/empty, raw string if NaN
 */
export function fmtMoney(v) {
  if (v === null || v === '') return '\u2014'; // em dash
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}

/**
 * Formats date as DD/MM/AAAA using pt-BR locale.
 * @param {string|number|Date} d - Date value (ISO string, timestamp, or Date object)
 * @returns {string} Brazilian date format DD/MM/AAAA, '—' if falsy, raw string if invalid
 */
export function fmtDate(d) {
  if (!d) return '\u2014'; // em dash

  let dt;
  // ISO date strings (YYYY-MM-DD) are parsed as UTC by Date constructor.
  // Parse manually as local date to avoid timezone shift.
  const isoMatch = String(d).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    dt = new Date(isoMatch[1], isoMatch[2] - 1, isoMatch[3]);
  } else {
    dt = new Date(d);
  }

  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('pt-BR');
}

/**
 * Formats Brazilian phone number.
 * Strips 55 prefix, formats as (XX) XXXXX-XXXX (11-digit mobile) or (XX) XXXX-XXXX (10-digit landline).
 * @param {string|number} num - Phone number (raw digits or with formatting)
 * @returns {string} Formatted phone, or raw stripped digits if neither 10 nor 11 digits
 */
export function formatBRPhone(num) {
  const s = String(num).replace(/\D/g, '');
  if (s.length === 13 && s.startsWith('55')) return formatBRPhone(s.slice(2));
  if (s.length === 11) return s.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  if (s.length === 10) return s.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  return s;
}

/**
 * Calculates years since inception date.
 * Supports DD/MM/AAAA (Brazilian) and ISO date formats.
 * Clamps minimum to 1 year.
 * @param {string} inicio - Date string in DD/MM/AAAA or ISO format
 * @returns {number} Years since inception (minimum 1)
 */
export function calcAnos(inicio) {
  if (!inicio) return 1;

  let date;
  // Brazilian format: DD/MM/AAAA
  const brMatch = String(inicio).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    date = new Date(brMatch[3], brMatch[2] - 1, brMatch[1]);
  } else {
    date = new Date(inicio);
  }

  if (isNaN(date.getTime())) return 1;

  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  const years = Math.floor((Date.now() - date.getTime()) / yearMs);
  return Math.max(1, years);
}
