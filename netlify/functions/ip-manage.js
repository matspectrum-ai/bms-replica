const { readJSON, writeJSON, isAdminToken } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

function isValidIP(ip) {
  if (typeof ip !== 'string' || !ip) return false;
  const v4 = ip.split('.');
  if (v4.length === 4) return v4.every(p => { const n = parseInt(p,10); return !isNaN(n) && n>=0 && n<=255 && String(n)===p; });
  const v6 = ip.split(':');
  if (v6.length >= 2 && v6.length <= 8) return v6.every(p => p === '' || /^[0-9a-fA-F]{1,4}$/.test(p));
  return false;
}

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const auth = (event.headers['authorization'] || event.headers['Authorization'] || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!isAdminToken(token)) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'admin_only' }) };

  try {
    if (event.httpMethod === 'GET') {
      const ips = await readJSON('ips') || [];
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ips }) };
    }
    if (event.httpMethod === 'POST') {
      const { action, ip, label } = JSON.parse(event.body || '{}');
      if (!action) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'missing_action' }) };
      const ips = await readJSON('ips') || [];

      if (action === 'add') {
        if (!ip || !isValidIP(ip)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid_ip' }) };
        if (ips.some(e => e.ip === ip)) return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: 'duplicate_ip' }) };
        ips.push({ ip, label: label || '', addedAt: new Date().toISOString() });
        await writeJSON('ips', ips);
        return { statusCode: 201, headers: CORS, body: JSON.stringify({ ips }) };
      }
      if (action === 'remove') {
        if (!ip) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'missing_ip' }) };
        const updated = ips.filter(e => e.ip !== ip);
        await writeJSON('ips', updated);
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ ips: updated }) };
      }
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid_action' }) };
    }
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'internal_error', message: e.message }) };
  }
};
