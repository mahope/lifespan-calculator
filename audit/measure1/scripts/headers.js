// Task 5: headers / transport. Read-only (HEAD, plus a few small GETs to measure compressed size).
const { execFileSync } = require('child_process');
const fs = require('fs');
const C = require('./common');

const SEC = ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy', 'cross-origin-opener-policy', 'cross-origin-resource-policy', 'cross-origin-embedder-policy'];
const CF = ['server', 'cf-ray', 'cf-cache-status', 'alt-svc', 'report-to', 'nel', 'cf-apo-via', 'server-timing'];

const curl = (args) => { try { return execFileSync('curl', ['-s', '--max-time', '30', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { return 'CURL_EXIT_' + e.status + ' ' + String(e.stdout || ''); } };

function parseHeaders(raw) {
  // last response block only (follow redirects not used here)
  const blocks = raw.split(/\r?\n\r?\n/).filter((b) => /^HTTP\//.test(b.trim()));
  const b = blocks[blocks.length - 1] || '';
  const lines = b.split(/\r?\n/);
  const status = lines[0];
  const h = {};
  for (const l of lines.slice(1)) { const i = l.indexOf(':'); if (i > 0) h[l.slice(0, i).toLowerCase()] = l.slice(i + 1).trim(); }
  return { status, h };
}

const out = [];
const log = (s = '') => { out.push(s); };

(async () => {
  const html = curl([C.BASE + '/']);
  const js = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  const css = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)].map((m) => m[1]);
  const mainJs = js.find((x) => /index-/.test(x)) || js[0];
  const targets = [
    ['/', 'html'], [mainJs, 'js (main hashed)'], [css[0], 'css'], ['/manifest.webmanifest', 'manifest'], ['/sw.js', 'sw'], ['/registerSW.js', 'registerSW'],
    ['/og-image.png', 'og-image'], ['/favicon.svg', 'favicon'], ['/robots.txt', 'robots'], ['/sitemap.xml', 'sitemap'], ['/ads.txt', 'ads.txt'],
    ['/xyz', '404 path (soft-404?)'], ['/privatlivspolitik', 'privatlivspolitik'], ['/privatlivspolitik.html', 'privatlivspolitik.html'], ['/cookiepolitik.html', 'cookiepolitik.html'],
  ];
  const rows = [];
  log('# Raw response headers (curl -sI = HEAD; "br,gzip" = HEAD with Accept-Encoding: br,gzip; GET size = bytes on the wire for GET with that encoding)');
  log(`# captured ${new Date().toISOString()} from agent-worker`);
  for (const [p, label] of targets) {
    if (!p) continue;
    const url = C.BASE + p;
    const plain = parseHeaders(curl(['-sI', url]));
    const br = parseHeaders(curl(['-sI', '-H', 'Accept-Encoding: br,gzip', url]));
    const getBr = curl(['-s', '-o', '/dev/null', '-H', 'Accept-Encoding: br,gzip', '-w', '%{size_download} %{content_type}', url]).split(' ');
    const getId = curl(['-s', '-o', '/dev/null', '-H', 'Accept-Encoding: identity', '-w', '%{size_download}', url]);
    log('\n=== ' + label + ' ' + p);
    log('--- curl -sI ' + url);
    log(plain.status);
    for (const [k, v] of Object.entries(plain.h)) log(`${k}: ${k === 'report-to' || k === 'nel' ? v.slice(0, 60) + '...' : v}`);
    log('--- curl -sI -H "Accept-Encoding: br,gzip" ' + url);
    log(br.status);
    for (const [k, v] of Object.entries(br.h)) if (['content-encoding', 'content-length', 'vary', 'content-type', 'cache-control', 'etag', 'last-modified'].includes(k)) log(`${k}: ${v}`);
    log(`GET size br,gzip: ${getBr[0]} bytes; identity: ${getId} bytes`);
    const g = (k) => br.h[k] || plain.h[k] || '';
    rows.push({
      label, path: p, status: plain.status.replace('HTTP/2 ', '').replace('HTTP/1.1 ', ''),
      ctype: plain.h['content-type'] || '', cenc_head_plain: plain.h['content-encoding'] || '', cenc_head_br: br.h['content-encoding'] || '',
      get_bytes_br: getBr[0], get_bytes_identity: getId,
      cache: plain.h['cache-control'] || '(none)', etag: plain.h['etag'] || '(none)', lastmod: plain.h['last-modified'] || '(none)',
      sec: Object.fromEntries(SEC.map((k) => [k, plain.h[k] || ''])),
      cf: Object.fromEntries(CF.map((k) => [k, plain.h[k] ? '1' : ''])),
      all: plain.h,
    });
  }

  // source maps (HEAD only; serve -s answers 200 text/html for anything missing, so judge by content-type)
  log('\n=== source maps (HEAD)');
  const maps = [];
  for (const j of [...js, '/sw.js', '/workbox-*.js']) {
    if (j.includes('*')) continue;
    const u = C.BASE + j + '.map';
    const r = parseHeaders(curl(['-sI', u]));
    maps.push({ url: j + '.map', status: r.status, ctype: r.h['content-type'], len: r.h['content-length'] });
    log(`${j}.map -> ${r.status} content-type=${r.h['content-type']} content-length=${r.h['content-length']}`);
  }

  // redirects
  log('\n=== redirects');
  const red = [];
  for (const u of ['http://levetidsberegner.dk/', 'http://www.levetidsberegner.dk/', 'https://www.levetidsberegner.dk/', 'https://levetidsberegner.dk/index.html', 'https://levetidsberegner.dk/hvor-lang-tid-har-jeg-tilbage/', 'https://levetidsberegner.dk//']) {
    let r = '';
    try { r = curl(['-sIL', '--max-redirs', '5', '-o', '/dev/null', '-w', '%{http_code} -> %{url_effective} (redirects=%{num_redirects}, first_hop_ms=%{time_redirect})', u]); } catch (e) { r = 'ERR ' + String(e).slice(0, 100); }
    const first = parseHeaders(curl(['-sI', '--max-time', '15', u]));
    log(`${u} => ${r} | first hop: ${first.status} location=${first.h['location'] || ''}`);
    red.push({ from: u, result: r, first: first.status, location: first.h['location'] || '' });
  }

  // TLS
  log('\n=== TLS');
  const tls = {};
  for (const [name, flags] of [['tls1.0 max', ['--tlsv1.0', '--tls-max', '1.0']], ['tls1.1 max', ['--tls-max', '1.1']], ['tls1.2 only', ['--tlsv1.2', '--tls-max', '1.2']], ['tls1.3', ['--tlsv1.3']]]) {
    let r;
    try { r = curl([...flags, '-o', '/dev/null', '-w', 'OK http=%{http_code} ssl=%{ssl_version}', C.BASE + '/']); } catch (e) { r = 'FAILED (exit ' + (e.status || '?') + ')'; }
    tls[name] = r; log(`${name}: ${r}`);
  }
  try {
    const cert = execFileSync('bash', ['-c', `echo | openssl s_client -connect levetidsberegner.dk:443 -servername levetidsberegner.dk 2>/dev/null | openssl x509 -noout -issuer -subject -dates -ext subjectAltName 2>&1 | head -12`], { encoding: 'utf8' });
    log(cert); tls.cert = cert;
  } catch (e) { log('openssl failed'); }
  try {
    const hv = curl(['-sI', '--http1.1', C.BASE + '/']).split('\n')[0];
    const h3 = curl(['-sI', '--http3-only', C.BASE + '/']);
    log('HTTP/1.1: ' + hv.trim()); log('HTTP/3 attempt: ' + (h3 ? h3.split('\n')[0].trim() : '(curl without http3 support or failed)'));
  } catch (e) { log('http3 probe unsupported by curl build'); }

  // DNS (www)
  try { const d = curl(['https://dns.google/resolve?name=www.levetidsberegner.dk&type=A']); log('\n=== DNS www A: ' + d.slice(0, 400)); } catch (e) {}

  fs.writeFileSync(C.OUT + '/headers.txt', out.join('\n') + '\n');
  C.writeJson(C.OUT + '/headers.json', { rows, maps, redirects: red, tls });

  // markdown table
  const md = [];
  md.push('| URL | status | content-type | enc (HEAD / GET bytes br vs identity) | cache-control | etag |');
  md.push('|---|---|---|---|---|---|');
  for (const r of rows) md.push(`| ${r.path} | ${r.status} | ${r.ctype} | ${r.cenc_head_br || '-'} / ${r.get_bytes_br} vs ${r.get_bytes_identity} | ${r.cache} | ${r.etag} |`);
  md.push('');
  md.push('| URL | HSTS | CSP | XCTO | XFO | Referrer-Policy | Permissions-Policy | COOP | CORP |');
  md.push('|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) md.push(`| ${r.path} | ${SEC.map((k) => (r.sec[k] ? 'yes: ' + r.sec[k].slice(0, 40) : 'MISSING')).join(' | ')} |`);
  fs.writeFileSync(C.OUT + '/headers-table.md', md.join('\n') + '\n');
  console.log(md.join('\n'));
  console.log(maps.map((m) => `${m.url} ${m.status} ${m.ctype} ${m.len}`).join('\n'));
  console.log(red.map((r) => `${r.from} => ${r.result} | ${r.first} ${r.location}`).join('\n'));
  console.log(JSON.stringify(tls, null, 1));
})();
