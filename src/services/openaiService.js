const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

async function chat(apiKey, messages, maxTokens = 1500, temperature = 0.75) {
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `OpenAI error (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function buildPostContext(posts, limit = 12) {
  return posts
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit)
    .map(p =>
      `[${p.platform.toUpperCase()}] ${p.type} | Engagement: ${p.engagement} | Views: ${p.views?.toLocaleString() || 0} | "${(p.caption || '').slice(0, 90)}"`
    )
    .join('\n');
}

export async function generateContentIdeas(apiKey, posts, platform, contentType, tone, count = 5) {
  const context = buildPostContext(posts.filter(p => !platform || p.platform === platform));

  const messages = [
    {
      role: 'system',
      content: 'You are a creative social media strategist who generates highly targeted, data-driven content ideas for content creators.',
    },
    {
      role: 'user',
      content: `Generate ${count} content ideas based on my top-performing posts.

MY BEST POSTS:
${context || 'No data yet — suggest ideas for a growing creator.'}

REQUIREMENTS:
• Platform: ${platform || 'Any'}
• Content type: ${contentType || 'Any'}
• Tone/style: ${tone || 'Engaging and authentic'}

For EACH idea, format exactly like this:

🎯 **[Title / Hook]**
📝 [2-sentence concept]
🏷️ [5 hashtags]
💡 [Why it will perform well based on my data]

---`,
    },
  ];

  return chat(apiKey, messages, 2200, 0.8);
}

export async function sendChatMessage(apiKey, history, posts, credentials) {
  const enabledPlatforms = Object.entries(credentials.platforms)
    .filter(([, p]) => p.enabled)
    .map(([name]) => name)
    .join(', ');

  const avgEng = posts.length > 0
    ? Math.round(posts.reduce((s, p) => s + p.engagement, 0) / posts.length)
    : 0;

  const system = `You are an expert social media analytics assistant for a content creator.

CREATOR DATA:
• Connected platforms: ${enabledPlatforms || 'none yet'}
• Total posts analyzed: ${posts.length}
• Average engagement per post: ${avgEng}

TOP POSTS (by engagement):
${buildPostContext(posts)}

Give specific, data-driven advice. Reference their actual metrics when relevant. Be conversational but insightful. Keep replies concise (under 250 words unless asked to elaborate).`;

  const messages = [{ role: 'system', content: system }, ...history];
  return chat(apiKey, messages, 800, 0.7);
}

export async function analyzeAudience(apiKey, posts) {
  if (posts.length === 0) throw new Error('No posts to analyze');

  const sample = posts.slice(0, 30).map(p => ({
    platform: p.platform,
    type: p.type,
    engagement: p.engagement,
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    engRate: p.engagementRate,
    hour: new Date(p.timestamp).getHours(),
    weekday: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(p.timestamp).getDay()],
    hashtags: (p.hashtags || []).slice(0, 5),
  }));

  const messages = [
    {
      role: 'system',
      content: 'You are an expert social media analyst. Provide deep, actionable, numbered insights.',
    },
    {
      role: 'user',
      content: `Analyze my content performance from this data and provide strategic insights:

${JSON.stringify(sample, null, 2)}

Structure your response with these headers:

## 🧑‍💻 Audience Behavior
## 📊 Content Performance Breakdown
## ⏰ Best Times to Post
## #️⃣ Hashtag Strategy
## 🚀 Top 3 Growth Actions
## 🔥 Virality Score (1–10) with explanation`,
    },
  ];

  return chat(apiKey, messages, 2000, 0.65);
}

export async function predictVirality(apiKey, concept, posts) {
  const avgEng = posts.length > 0
    ? Math.round(posts.reduce((s, p) => s + p.engagement, 0) / posts.length)
    : 0;

  const avgViews = posts.length > 0
    ? Math.round(posts.reduce((s, p) => s + (p.views || 0), 0) / posts.length)
    : 0;

  const topTags = Object.entries(
    posts.flatMap(p => p.hashtags || []).reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([t]) => t);

  const messages = [
    {
      role: 'system',
      content: 'You are a viral content prediction expert. Provide specific numerical predictions.',
    },
    {
      role: 'user',
      content: `Predict the viral potential for this content concept:

CONCEPT: "${concept}"

MY BASELINE:
• Avg engagement/post: ${avgEng}
• Avg views/post: ${avgViews.toLocaleString()}
• Posts analyzed: ${posts.length}
• My best hashtags: ${topTags.join(', ') || 'none yet'}

Format your response exactly like this:

## 🎯 Viral Score: X/100

## 📈 Predicted Engagement: [specific number]
## 👁️ Predicted Reach: [specific number]

## ✅ Strengths
[3 bullet points]

## ⚠️ Risks
[2 bullet points]

## ✨ Optimized Hook
"[improved version of the concept]"

## 🏷️ Recommended Hashtags
[10 specific hashtags]`,
    },
  ];

  return chat(apiKey, messages, 1200, 0.65);
}
