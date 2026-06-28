const { readJSON, isAdminToken } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  const auth = (event.headers['authorization'] || event.headers['Authorization'] || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!isAdminToken(token)) return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'admin_only' }) };
  try {
    const accounts = await readJSON('accounts') || [];
    const safe = accounts.map(a => ({ username: a.username, createdAt: a.createdAt }));
    const requests = await readJSON('access_requests') || [];
    const waitlist = await readJSON('waitlist') || [];
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ accounts: safe, accessRequests: requests, waitlist }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
