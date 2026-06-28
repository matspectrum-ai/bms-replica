const { readJSON } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

function extractIP(headers) {
  const fwd = headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  const cip = headers['client-ip'];
  if (cip) return cip;
  return '0.0.0.0';
}

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  try {
    const ip = extractIP(event.headers || {});
    const ips = await readJSON('ips') || [];
    const allowed = ips.length === 0 || ips.some(e => e.ip === ip);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ allowed, ip }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
