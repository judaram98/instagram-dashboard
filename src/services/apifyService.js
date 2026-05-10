const APIFY_BASE = 'https://api.apify.com/v2';

const ACTORS = {
  instagram: 'apify/instagram-scraper',
  tiktok: 'clockworks/free-tiktok-scraper',
  youtube: 'streamers/youtube-scraper',
};

function buildInput(platform, handle) {
  const cleanHandle = handle.replace(/^@/, '');
  switch (platform) {
    case 'instagram':
      return {
        directUrls: [`https://www.instagram.com/${cleanHandle}/`],
        resultsType: 'posts',
        resultsLimit: 50,
        addParentData: false,
      };
    case 'tiktok':
      return {
        profiles: [`https://www.tiktok.com/@${cleanHandle}`],
        resultsPerPage: 50,
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      };
    case 'youtube':
      return {
        startUrls: [{ url: `https://www.youtube.com/@${cleanHandle}` }],
        maxResults: 50,
        downloadSubtitles: false,
      };
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

async function startRun(platform, handle, apiToken) {
  const actor = encodeURIComponent(ACTORS[platform]);
  const input = buildInput(platform, handle);

  const res = await fetch(`${APIFY_BASE}/acts/${actor}/runs?token=${apiToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Failed to start ${platform} actor (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.data.id;
}

function pollUntilSucceeded(runId, apiToken, onTick) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 120;

    const interval = setInterval(async () => {
      attempts++;

      if (attempts > MAX_ATTEMPTS) {
        clearInterval(interval);
        reject(new Error('Scraping timed out after 6 minutes'));
        return;
      }

      try {
        const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apiToken}`);
        if (!res.ok) return;

        const { data } = await res.json();
        const { status, defaultDatasetId } = data;

        onTick?.(status, attempts);

        if (status === 'SUCCEEDED') {
          clearInterval(interval);
          resolve(defaultDatasetId);
        } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
          clearInterval(interval);
          reject(new Error(`Apify run ${status.toLowerCase()}`));
        }
      } catch (err) {
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(interval);
          reject(err);
        }
      }
    }, 3000);
  });
}

async function fetchDatasetItems(datasetId, apiToken) {
  const res = await fetch(
    `${APIFY_BASE}/datasets/${datasetId}/items?token=${apiToken}&clean=1&format=json`
  );
  if (!res.ok) throw new Error('Failed to fetch dataset items');
  return res.json();
}

function normalizePost(raw, platform) {
  const post = {
    id: '',
    platform,
    type: 'post',
    caption: '',
    thumbnail: '',
    url: '',
    likes: 0,
    comments: 0,
    views: 0,
    shares: 0,
    saves: 0,
    engagement: 0,
    engagementRate: '0.00',
    hashtags: [],
    timestamp: new Date().toISOString(),
  };

  if (platform === 'instagram') {
    post.id = raw.id || raw.shortCode || String(Math.random());
    post.caption = raw.caption || '';
    post.thumbnail = raw.displayUrl || raw.thumbnailUrl || '';
    post.url = raw.url || `https://www.instagram.com/p/${raw.shortCode}/`;
    post.likes = raw.likesCount || 0;
    post.comments = raw.commentsCount || 0;
    post.views = raw.videoViewCount || raw.videoPlayCount || 0;
    post.saves = raw.savesCount || 0;
    post.type = raw.type === 'Video' ? 'video' : raw.type === 'Sidecar' ? 'carousel' : 'image';
    post.hashtags = Array.isArray(raw.hashtags) ? raw.hashtags : [];
    post.timestamp = raw.timestamp || raw.takenAt || new Date().toISOString();
    post.engagement = post.likes + post.comments + post.saves;
  } else if (platform === 'tiktok') {
    post.id = raw.id || String(Math.random());
    post.caption = raw.text || raw.description || '';
    post.thumbnail = raw.coverUrl || raw.cover || '';
    post.url = raw.webVideoUrl || raw.url || '';
    post.likes = raw.diggCount || raw.likesCount || 0;
    post.comments = raw.commentCount || raw.commentsCount || 0;
    post.views = raw.playCount || raw.viewCount || 0;
    post.shares = raw.shareCount || 0;
    post.type = 'video';
    post.hashtags = (raw.hashtags || []).map(h => (typeof h === 'string' ? h : h.name || '')).filter(Boolean);
    post.timestamp = raw.createTime
      ? new Date(raw.createTime * 1000).toISOString()
      : raw.createdAt || new Date().toISOString();
    post.engagement = post.likes + post.comments + post.shares;
  } else if (platform === 'youtube') {
    post.id = raw.id || raw.videoId || String(Math.random());
    post.caption = raw.title || '';
    post.thumbnail = raw.thumbnailUrl || raw.bestThumbnail?.url || '';
    post.url = raw.url || raw.pageUrl || `https://www.youtube.com/watch?v=${raw.id}`;
    post.likes = raw.likes || raw.likeCount || 0;
    post.comments = raw.commentsCount || raw.commentCount || 0;
    post.views = raw.viewCount || raw.views || 0;
    post.type = raw.type === 'shorts' ? 'short' : 'video';
    post.hashtags = Array.isArray(raw.hashtags) ? raw.hashtags : [];
    post.timestamp = raw.date || raw.publishedAt || new Date().toISOString();
    post.engagement = post.likes + post.comments;
  }

  post.engagementRate = post.views > 0
    ? ((post.engagement / post.views) * 100).toFixed(2)
    : '0.00';

  return post;
}

export async function scrapePlatform(platform, handle, apiToken, onProgress) {
  onProgress?.('Starting actor…', 5);

  const runId = await startRun(platform, handle, apiToken);
  onProgress?.('Actor running, polling…', 12);

  const datasetId = await pollUntilSucceeded(runId, apiToken, (_status, attempt) => {
    const pct = Math.min(12 + (attempt / 120) * 75, 87);
    onProgress?.(`Polling… (${attempt * 3}s)`, pct);
  });

  onProgress?.('Downloading dataset…', 90);
  const rawItems = await fetchDatasetItems(datasetId, apiToken);

  onProgress?.('Normalizing data…', 97);
  const normalized = rawItems.map(item => normalizePost(item, platform));

  onProgress?.('Done', 100);
  return normalized;
}

export async function scrapeAllPlatforms(credentials, onProgress) {
  const { platforms, apifyToken } = credentials;
  const enabled = Object.entries(platforms).filter(([, p]) => p.enabled && p.handle?.trim());

  if (enabled.length === 0) throw new Error('No platforms configured with handles');

  const allPosts = [];

  for (let i = 0; i < enabled.length; i++) {
    const [platform, config] = enabled[i];
    const platformBase = i / enabled.length;
    const platformSlice = 1 / enabled.length;

    const posts = await scrapePlatform(
      platform,
      config.handle.trim(),
      apifyToken,
      (msg, pct) => {
        const overall = (platformBase + (pct / 100) * platformSlice) * 100;
        onProgress?.(platform, msg, Math.round(overall));
      }
    );

    allPosts.push(...posts);
  }

  return allPosts.sort((a, b) => b.engagement - a.engagement);
}
