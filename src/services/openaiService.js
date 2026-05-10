const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const MODEL      = 'gpt-4o-mini';

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
    throw new Error(body.error?.message || `Error de OpenAI (HTTP ${res.status})`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

function buildPostContext(posts, limit = 12) {
  return posts
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit)
    .map(p =>
      `[${p.platform.toUpperCase()}] ${p.type} | Interacción: ${p.engagement} | Vistas: ${p.views?.toLocaleString('es-MX') || 0} | "${(p.caption || '').slice(0, 90)}"`
    )
    .join('\n');
}

export async function generateContentIdeas(apiKey, posts, platform, contentType, tone, count = 5) {
  const context = buildPostContext(posts.filter(p => !platform || p.platform === platform));

  const messages = [
    {
      role: 'system',
      content: 'Eres un estratega creativo de redes sociales especializado en generar ideas de contenido altamente enfocadas y basadas en datos para creadores de contenido hispanohablantes. Responde siempre en español.',
    },
    {
      role: 'user',
      content: `Genera ${count} ideas de contenido basadas en mis publicaciones con mejor rendimiento.

MIS MEJORES PUBLICACIONES:
${context || 'Sin datos aún — sugiere ideas para un creador en crecimiento.'}

REQUISITOS:
• Plataforma: ${platform || 'Cualquiera'}
• Tipo de contenido: ${contentType || 'Cualquiera'}
• Tono/estilo: ${tone || 'Auténtico y cercano'}

Para CADA idea, usa exactamente este formato:

🎯 **[Título / Gancho]**
📝 [Concepto en 2 oraciones]
🏷️ [5 hashtags relevantes]
💡 [Por qué funcionará bien según mis datos]

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

  const system = `Eres un asistente experto en analíticas de redes sociales para un creador de contenido hispanohablante.

DATOS DEL CREADOR:
• Plataformas conectadas: ${enabledPlatforms || 'ninguna aún'}
• Total de publicaciones analizadas: ${posts.length}
• Interacción promedio por publicación: ${avgEng.toLocaleString('es-MX')}

MEJORES PUBLICACIONES (por interacción):
${buildPostContext(posts)}

Da consejos específicos y basados en datos. Haz referencia a las métricas reales del creador cuando sea relevante. Sé conversacional pero perspicaz. Mantén las respuestas concisas (menos de 250 palabras a menos que te pidan más detalle). Responde siempre en español.`;

  const messages = [{ role: 'system', content: system }, ...history];
  return chat(apiKey, messages, 800, 0.7);
}

export async function analyzeAudience(apiKey, posts) {
  if (posts.length === 0) throw new Error('No hay publicaciones para analizar');

  const sample = posts.slice(0, 30).map(p => ({
    plataforma:  p.platform,
    tipo:        p.type,
    interaccion: p.engagement,
    vistas:      p.views,
    likes:       p.likes,
    comentarios: p.comments,
    tasaEng:     p.engagementRate,
    hora:        new Date(p.timestamp).getHours(),
    diaSemana:   ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(p.timestamp).getDay()],
    hashtags:    (p.hashtags || []).slice(0, 5),
  }));

  const messages = [
    {
      role: 'system',
      content: 'Eres un analista experto en redes sociales. Proporciona insights profundos, accionables y numerados. Responde siempre en español.',
    },
    {
      role: 'user',
      content: `Analiza el rendimiento de mi contenido a partir de estos datos y proporciona insights estratégicos:

${JSON.stringify(sample, null, 2)}

Estructura tu respuesta con estos encabezados:

## 🧑‍💻 Comportamiento de la audiencia
## 📊 Análisis de rendimiento del contenido
## ⏰ Mejores horarios para publicar
## #️⃣ Estrategia de hashtags
## 🚀 Top 3 acciones de crecimiento
## 🔥 Puntuación de viralidad (1–10) con explicación`,
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
      content: 'Eres un experto en predicción de contenido viral. Proporciona predicciones numéricas específicas. Responde siempre en español.',
    },
    {
      role: 'user',
      content: `Predice el potencial viral de este concepto de contenido:

CONCEPTO: "${concept}"

MI LÍNEA BASE:
• Interacción promedio/publicación: ${avgEng.toLocaleString('es-MX')}
• Vistas promedio/publicación: ${avgViews.toLocaleString('es-MX')}
• Publicaciones analizadas: ${posts.length}
• Mis mejores hashtags: ${topTags.join(', ') || 'ninguno aún'}

Formatea tu respuesta exactamente así:

## 🎯 Puntuación viral: X/100

## 📈 Interacción predicha: [número específico]
## 👁️ Alcance predicho: [número específico]

## ✅ Fortalezas
[3 puntos]

## ⚠️ Riesgos
[2 puntos]

## ✨ Gancho optimizado
"[versión mejorada del concepto]"

## 🏷️ Hashtags recomendados
[10 hashtags específicos]`,
    },
  ];

  return chat(apiKey, messages, 1200, 0.65);
}
