const { readJSON, writeJSON, isAdminToken } = require('./_shared/data');
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  const auth = event.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!isAdminToken(token)) {
    return { statusCode: 403, headers: CORS, body: JSON.stringify({ error: 'forbidden' }) };
  }

  if (event.httpMethod === 'GET') {
    const deviceId = readJSON('cliente_device');
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ deviceRegistered: !!deviceId, deviceId: deviceId })
    };
  }

  if (event.httpMethod === 'POST') {
    writeJSON('cliente_device', null);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, message: 'Device binding reset. Next login will register the new device.' })
    };
  }

  return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'method_not_allowed' }) };
};
