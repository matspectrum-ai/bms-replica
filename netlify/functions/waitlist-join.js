const { readJSON, writeJSON } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };
  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email || !email.includes('@')) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid_email' }) };
    const list = await readJSON('waitlist') || [];
    list.push({ email, joinedAt: new Date().toISOString() });
    await writeJSON('waitlist', list);
    return { statusCode: 201, headers: CORS, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
