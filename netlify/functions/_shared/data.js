/**
 * netlify/functions/_shared/data.js
 * Shared data access layer for all Netlify Functions.
 *
 * Provides persistent JSON file storage via Node.js fs module.
 * All functions use this SINGLE access point — no function accesses fs directly.
 *
 * Data directory: /tmp/data (persists across warm invocations on Netlify;
 * acceptable for beta with max 2 accounts per D-05).
 *
 * @module _shared/data
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = '/tmp/data';

/**
 * Ensures the data directory exists, creating it recursively if absent.
 * No-op if directory already exists.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads and parses a JSON file from the data directory.
 *
 * @param {string} filename - Name of the JSON file (e.g. 'accounts.json').
 * @returns {any|null} Parsed JSON content, or null if the file does not exist
 *   or contains corrupt/malformed JSON.
 */
function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (_err) {
    // File not found or corrupt JSON — return null, callers handle defaults.
    return null;
  }
}

/**
 * Serializes data to JSON and writes it to the data directory.
 *
 * @param {string} filename - Name of the JSON file (e.g. 'accounts.json').
 * @param {any} data - Data to serialize (must be JSON-serializable).
 */
function writeJSON(filename, data) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, json, 'utf-8');
}

module.exports = { readJSON, writeJSON };
