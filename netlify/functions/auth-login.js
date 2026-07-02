const crypto = require('crypto');
const { readJSON, writeJSON, ADMIN } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Id', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

function hashPassword(pw) { return crypto.createHash('sha256').update(pw + 'bms-salt-2026').digest('hex'); }

// Hardcoded second account (not admin)
const CLIENTE = {
  username: 'cliente',
  passwordHash: hashPassword('cliente123'),
  token: 'cliente-token-bms-2026',
  isAdmin: false
};

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };

  try {
    const { username, password } = JSON.parse(event.body || '{}');
    if (!username || !password) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'invalid_input' }) };

    // Admin — no device check, but check for pending alerts
    if (username === ADMIN.username && password === ADMIN.password) {
      const alert = readJSON('admin_alert');
      const body = { token: ADMIN.token, username: ADMIN.username, isAdmin: true };
      if (alert) {
        body.alert = alert;
        writeJSON('admin_alert', null);
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify(body) };
    }

    // Cliente — device binding check
    if (username === CLIENTE.username && hashPassword(password) === CLIENTE.passwordHash) {
      const deviceId = (event.headers['x-device-id'] || '').trim();
      const storedDeviceId = readJSON('cliente_device');

      if (!storedDeviceId) {
        // First login ever — register this device
        writeJSON('cliente_device', deviceId);
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({ token: CLIENTE.token, username: CLIENTE.username, isAdmin: false })
        };
      }

      if (deviceId && deviceId === storedDeviceId) {
        // Same registered device — allow
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify({ token: CLIENTE.token, username: CLIENTE.username, isAdmin: false })
        };
      }

      // Different device — block and notify admin
      writeJSON('admin_alert', {
        type: 'device_change',
        message: 'Tentativa de acesso da conta "cliente" de um novo dispositivo.',
        timestamp: new Date().toISOString(),
        deviceAttempted: deviceId || 'unknown'
      });

      return {
        statusCode: 401,
        headers: CORS,
        body: JSON.stringify({ error: 'device_changed' })
      };
    }

    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'invalid_credentials' }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'internal_error', message: e.message }) };
  }
};
