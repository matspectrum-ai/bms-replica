const crypto = require('crypto');
const { readJSON, writeJSON } = require('./_shared/data');
const SALT = 'bms-salt-2026';
const MAX = 2;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
function hashPw(pw) { return crypto.createHash('sha256').update(pw + SALT).digest('hex'); }

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'account_limit_reached' }) };
};
