// CORS Proxy Layer — matches RECON.md §5.10 instalarProxy() exactly
// Monkey-patches window.fetch to rewrite Cloudflare/SMS24h URLs to
// same-origin proxy paths (/cf-api/, /sms-api/) for Netlify deployment.

export function instalarProxy() {
  if (location.protocol === 'file:') return; // local: no proxy needed
  const orig = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string') {
      if (url.startsWith('https://api.cloudflare.com')) {
        url = url.replace('https://api.cloudflare.com', '/cf-api');
      } else if (url.startsWith('https://api.sms24h.org')) {
        url = url.replace('https://api.sms24h.org', '/sms-api');
      } else if (url.startsWith('https://sms24h.org')) {
        url = url.replace('https://sms24h.org', '/sms-api');
      }
    }
    return orig(url, opts);
  };
}
