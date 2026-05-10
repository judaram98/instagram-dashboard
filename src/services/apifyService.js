const ACTORS = {
  instagram: 'apify/instagram-scraper',
  tiktok:    'clockworks/free-tiktok-scraper',
  youtube:   'streamers/youtube-scraper',
};

function buildInput(platform, handle) {
  const h = handle.replace(/^@/, '');
  switch (platform) {
    case 'instagram':
      return { directUrls: [`https://www.instagram.com/${h}/`], resultsType: 'posts', resultsLimit: 50, addParentData: false };
    case 'tiktok':
      return { profiles: [`https://www.tiktok.com/@${h}`], resultsPerPage: 50, shouldDownloadVideos: false, shouldDownloadCovers: false };
    case 'youtube':
      return { startUrls: [{ url: `https://www.youtube.com/@${h}` }], maxResults: 50, downloadSubtitles: false };
    default:
      throw new Error(`Plataforma desconocida: ${platform}`);
  }
}

async function apify(endpoint, method = 'GET', body = null) {
  const res = await fetch('/api/proxy-apify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, method, body }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error proxy Apify (HTTP ${res.status})`);
  }
  return res.json();
}

async function startRun(platform, handle) {
  const actor = encodeURIComponent(ACTORS[platform]);
  const data  = await apify(`acts/${actor}/runs`, 'POST', buildInput(platform, handle));
  if (!data?.data?.id) throw new Error(`Error al iniciar actor de ${platform}`);
  return data.data.id;
}

function pollUntilSucceeded(runId, onTick) {
  return new Promise((resolve, reject) => {
    let attempts       = 0;
    const MAX_ATTEMPTS = 120;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        reject(new Error('El scraping expiró después de 6 minutos'));
        return;
      }
      try {
        const { data } = await apify(`actor-runs/${runId}`, 'GET');
        const { status, defaultDatasetId } = data;
        onTick?.(status, attempts);
        if (status === 'SUCCEEDED') {
          clearInterval(interval);
          resolve(defaultDatasetId);
        } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
          clearInterval(interval);
          const STATUS_ES = { FAILED: 'falló', ABORTED: 'fue cancelado', 'TIMED-OUT': 'expiró' };
          reject(new Error(`El proceso de Apify ${STATUS_ES[status] || status.toLowerCase()}`));
        }
      } catch (err) {
        if (attempts >= MAX_ATTEMPTS) { clearInterval(interval); reject(err); }
      }
    }, 3000);
  });
}

async function fetchDatasetItems(datasetId) {
  return apify(`datasets/${datasetId}/items?clean=1&format=json`, 'GET');
}

function normalizePost(raw, platform) {
  const post = {
    id: '', platform, type: 'post', caption: '', thumbnail: '', url: '',
    videoUrl: '', images: [],
    likes: 0, comments: 0, views: 0, shares: 0, saves: 0,
    engagement: 0, engagementRate: '0.00', hashtags: [],
    timestamp: new Date().toISOString(),
  };

  if (platform === 'instagram') {
    post.id        = raw.id || raw.shortCode || String(Math.random());
    post.caption   = raw.caption || '';
    post.thumbnail = raw.displayUrl || raw.thumbnailUrl || '';
    post.url       = raw.url || `https://www.instagram.com/p/${raw.shortCode}/`;
    post.likes     = raw.likesCount || 0;
    post.comments  = raw.commentsCount || 0;
    post.views     = raw.videoViewCount || raw.videoPlayCount || 0;
    post.saves     = raw.savesCount || 0;
    post.type      = raw.type === 'Video' ? 'video' : raw.type === 'Sidecar' ? 'carousel' : 'image';
    post.videoUrl  = raw.type === 'Video' ? (raw.videoUrl || raw.videoSrc || '') : '';
    post.images    = raw.type === 'Sidecar'
      ? (raw.sidecarChildren || raw.childPosts || [])
          .map(c => c.displayUrl || c.thumbnailUrl || '')
          .filter(Boolean)
      : [];
    post.hashtags  = Array.isArray(raw.hashtags) ? raw.hashtags : [];
    post.timestamp = raw.timestamp || raw.takenAt || new Date().toISOString();
    post.engagement = post.likes + post.comments + post.saves;
  } else if (platform === 'tiktok') {
    post.id        = raw.id || String(Math.random());
    post.caption   = raw.text || raw.description || '';
    post.thumbnail = raw.coverUrl || raw.cover || '';
    post.url       = raw.webVideoUrl || raw.url || '';
    post.likes     = raw.diggCount || raw.likesCount || 0;
    post.comments  = raw.commentCount || raw.commentsCount || 0;
    post.views     = raw.playCount || raw.viewCount || 0;
    post.shares    = raw.shareCount || 0;
    post.type      = 'video';
    post.videoUrl  = raw.downloadAddr || raw.videoUrl || raw.videoMeta?.downloadAddr || '';
    post.hashtags  = (raw.hashtags || []).map(h => (typeof h === 'string' ? h : h.name || '')).filter(Boolean);
    post.timestamp = raw.createTime ? new Date(raw.createTime * 1000).toISOString() : raw.createdAt || new Date().toISOString();
    post.engagement = post.likes + post.comments + post.shares;
  } else if (platform === 'youtube') {
    post.id        = raw.id || raw.videoId || String(Math.random());
    post.caption   = raw.title || '';
    post.thumbnail = raw.thumbnailUrl || raw.bestThumbnail?.url || '';
    post.url       = raw.url || raw.pageUrl || `https://www.youtube.com/watch?v=${raw.id}`;
    post.likes     = raw.likes || raw.likeCount || 0;
    post.comments  = raw.commentsCount || raw.commentCount || 0;
    post.views     = raw.viewCount || raw.views || 0;
    post.type      = raw.type === 'shorts' ? 'short' : 'video';
    post.hashtags  = Array.isArray(raw.hashtags) ? raw.hashtags : [];
    post.timestamp = raw.date || raw.publishedAt || new Date().toISOString();
    post.engagement = post.likes + post.comments;
  }

  post.engagementRate = post.views > 0 ? ((post.engagement / post.views) * 100).toFixed(2) : '0.00';
  return post;
}

export async function scrapePlatform(platform, handle, _token, onProgress) {
  onProgress?.('Iniciando actor…', 5);
  const runId = await startRun(platform, handle);
  onProgress?.('Actor en ejecución, verificando…', 12);

  const datasetId = await pollUntilSucceeded(runId, (_status, attempt) => {
    const pct = Math.min(12 + (attempt / 120) * 75, 87);
    onProgress?.(`Verificando… (${attempt * 3}s)`, pct);
  });

  onProgress?.('Descargando datos…', 90);
  const rawItems = await fetchDatasetItems(datasetId);

  onProgress?.('Procesando datos…', 97);
  const normalized = rawItems.map(item => normalizePost(item, platform));

  onProgress?.('Completado', 100);
  return normalized;
}

export async function scrapeAllPlatforms(credentials, onProgress) {
  const { platforms } = credentials;
  const enabled = Object.entries(platforms || {}).filter(([, p]) => p.enabled && p.handle?.trim());

  if (enabled.length === 0) throw new Error('No hay plataformas configuradas con usuario');

  const allPosts = [];

  for (let i = 0; i < enabled.length; i++) {
    const [platform, config] = enabled[i];
    const platformBase  = i / enabled.length;
    const platformSlice = 1 / enabled.length;

    const posts = await scrapePlatform(
      platform,
      config.handle.trim(),
      null,
      (msg, pct) => {
        const overall = (platformBase + (pct / 100) * platformSlice) * 100;
        onProgress?.(platform, msg, Math.round(overall));
      }
    );

    allPosts.push(...posts);
  }

  return allPosts.sort((a, b) => b.engagement - a.engagement);
}
