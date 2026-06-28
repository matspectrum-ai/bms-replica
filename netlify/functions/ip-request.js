const { readJSON, writeJSON } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
function extractIP(headers) { const fwd = headers['x-forwarded-for']; if (fwd) return fwd.split(',')[0].trim(); return (headers['client-ip'] || '0.0.0.0'); }

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const { reason } = JSON.parse(event.body || '{}');
    const ip = extractIP(event.headers || {});
    const requests = await readJSON('access_requests') || [];
    requests.push({ ip, reason: reason || '', requestedAt: new Date().toISOString() });
    await writeJSON('access_requests', requests);
    return { statusCode: 201, headers: CORS, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
