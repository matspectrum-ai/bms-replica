const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

function getIP(headers) {
  const fwd = headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (headers['client-ip'] || '0.0.0.0');
}

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  try {
    const ip = getIP(event.headers || {});
    const allowlist = JSON.parse(process.env.BMS_IP_ALLOWLIST || '[]');
    const allowed = allowlist.length === 0 || allowlist.includes(ip);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ allowed, ip }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
