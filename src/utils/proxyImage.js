/**
 * Ruteador de imágenes por proxy para CDNs con Cross-Origin-Resource-Policy
 * restrictivo (Instagram, TikTok).
 *
 * wsrv.nl (images.weserv.nl) fetcha la imagen server-side y la sirve sin
 * las cabeceras CORP bloqueantes. Es gratuito y sin límite de tasa registrado.
 *
 * Uso:
 *   proxyImage(url)           → versión proxeada (400px de ancho por defecto)
 *   proxyImage(url, 800)      → proxeada a 800px de ancho
 *   proxyImage(null)          → '' (seguro para src vacío)
 */

const PROXY_BASE = 'https://wsrv.nl/?';

/** Dominios cuyas imágenes requieren proxy por CORP */
const BLOCKED_DOMAINS = [
  'cdninstagram.com',
  'scontent-',        // subdominios de Instagram
  'lookaside.fbsbx.com',
  'p16-sign',         // TikTok CDN
  'p77-sign',
  'p19-sign',
  'tiktokcdn.com',
];

/**
 * @param {string|null|undefined} url  URL original de la imagen
 * @param {number} [width=400]         Ancho máximo deseado en px
 * @returns {string}                   URL proxeada o la original si no requiere proxy
 */
export function proxyImage(url, width = 400) {
  if (!url || typeof url !== 'string') return '';

  const needsProxy = BLOCKED_DOMAINS.some(domain => url.includes(domain));
  if (!needsProxy) return url;

  const params = new URLSearchParams({
    url,
    w:      String(width),
    output: 'jpg',
    q:      '85',
    // "il" = interlace (JPEG progresivo, carga más suave)
    il:     '',
  });

  return `${PROXY_BASE}${params.toString()}`;
}
