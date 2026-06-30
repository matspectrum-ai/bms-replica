const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const { readJSON } = require('./_shared/data');

function getIP(headers) {
  const fwd = headers['x-forwarded-for'];
  if (fwd) return fwd.split(',')[0].trim();
  return (headers['client-ip'] || '0.0.0.0');
}

// Checks if clientIP matches any allowed IP or prefix
function isAllowed(clientIP, ips) {
  for (const entry of ips) {
    const allowed = entry.ip;
    // Exact match
    if (clientIP === allowed) return true;
    // CIDR prefix match (e.g., "2804:3ab4:70e6:1700::/64")
    if (allowed.includes('/')) {
      if (matchCIDR(clientIP, allowed)) return true;
    }
    // Partial IPv6: first N segments of allowed match client (e.g. "2804:3ab4:70e6:1700")
    if (allowed.includes(':') && clientIP.includes(':') && !allowed.includes('/')) {
      const aSegs = allowed.split(':');
      const cSegs = clientIP.split(':');
      if (aSegs.every((s, i) => s === cSegs[i])) return true;
    }
  }
  return false;
}

function matchCIDR(ip, cidr) {
  const [range, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);
  if (isNaN(bits)) return false;
  if (range.includes(':')) {
    // IPv6: compare segment-by-segment up to bits/16 segments
    const rSegs = range.split(':');
    const iSegs = ip.split(':');
    const fullSegs = Math.floor(bits / 16);
    for (let i = 0; i < fullSegs; i++) {
      if (rSegs[i] !== iSegs[i]) return false;
    }
    return true;
  }
  // IPv4: compare prefix
  return ip.startsWith(range);
}

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  try {
    const ip = getIP(event.headers || {});
    const ips = await readJSON('ips') || [];
    const allowed = ips.length === 0 || isAllowed(ip, ips);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ allowed, ip }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
