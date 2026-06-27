// src/stores/data.js — localStorage persistence layer
// Source: RECON.md §5.1 getDB/saveDB/getSettings/saveSettings (§3.1-3.2 schemas)
// Matches original function signatures exactly per D-04.
//
// This is the SINGLE access point for localStorage — no other module
// accesses localStorage directly. Keys match the original for VAL-02
// bidirectional storage compatibility.
//
// Circular dependency note: data.js imports refreshHeaderStatus from header.js,
// and header.js imports getSettings from data.js. This is safe because
// refreshHeaderStatus is only called at runtime (inside saveSettings), not
// at module evaluation time. ES modules resolve circular imports correctly
// when the imported value is used lazily.

const STORAGE_KEY = 'lab_bms_db_v1';
const SETTINGS_KEY = 'lab_bms_settings_v1';

// Import toast for error notification on QuotaExceededError.
// Created by Plan 04 — stub exists in src/widgets/toast.js until then.
import { toast } from '../widgets/toast.js';

// Import refreshHeaderStatus — saveSettings must call this as a side effect.
// Created by Plan 02-02 Task 03 — stub exists in src/utils/header.js until then.
import { refreshHeaderStatus } from '../utils/header.js';

/**
 * Returns parsed app database from localStorage.
 * Falls back to default {empresas:[], sites:[], sms:[]} if key missing or JSON corrupt.
 * @returns {AppDatabase} Parsed database object
 */
export function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { empresas: [], sites: [], sms: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Corrupted localStorage DB, using defaults');
    return { empresas: [], sites: [], sms: [] };
  }
}

/**
 * Persists full database object to localStorage.
 * Wraps setItem in try/catch for QuotaExceededError (Pitfall 4).
 * @param {AppDatabase} db - Full database object to persist
 */
export function saveDB(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('localStorage quota exceeded in saveDB', e);
    try {
      toast('⚠️ Erro ao salvar: armazenamento cheio. Exporte seu backup.', '⚠️');
    } catch (_) {
      // toast module may not be fully loaded yet — fail silently
    }
  }
}

/**
 * Returns parsed settings from localStorage.
 * Falls back to {} if key missing or JSON corrupt.
 * All fields are optional — downstream code null-checks individual fields.
 * @returns {Settings} Parsed settings object
 */
export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Corrupted localStorage settings, using defaults');
    return {};
  }
}

/**
 * Persists settings to localStorage.
 * Calls refreshHeaderStatus() as side effect (matches original, RECON.md line 221).
 * Wraps setItem in try/catch for QuotaExceededError (Pitfall 4).
 * @param {Settings} s - Full settings object to persist
 */
export function saveSettings(s) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    console.error('localStorage quota exceeded in saveSettings', e);
    try {
      toast('⚠️ Erro ao salvar: armazenamento cheio. Exporte seu backup.', '⚠️');
    } catch (_) {
      // toast module may not be fully loaded yet — fail silently
    }
    return; // Don't call refreshHeaderStatus if save failed
  }
  refreshHeaderStatus();
}
