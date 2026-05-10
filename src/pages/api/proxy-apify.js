export const prerender = false;

export async function POST({ request }) {
  const APIFY_TOKEN = import.meta.env.APIFY_TOKEN;

  if (!APIFY_TOKEN) {
    return new Response(JSON.stringify({ error: 'Apify token not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { endpoint, method = 'GET', body: reqBody } = payload;

  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Missing endpoint field.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://api.apify.com/v2/${endpoint}${separator}token=${APIFY_TOKEN}`;

  const fetchOptions = {
    method,
    headers: method !== 'GET' ? { 'Content-Type': 'application/json' } : {},
  };
  if (reqBody !== undefined && method !== 'GET') {
    fetchOptions.body = JSON.stringify(reqBody);
  }

  const upstream = await fetch(url, fetchOptions);
  const data = await upstream.json().catch(() => ({ error: `Apify HTTP ${upstream.status}` }));

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
