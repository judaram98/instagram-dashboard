const OPENAI_API = 'https://api.openai.com/v1/chat/completions';
const MODEL      = 'gpt-4o-mini';

async function chat(apiKey, messages, maxTokens = 1500, temperature = 0.75) {
  const res = await fetch(OPENAI_API, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
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

function parseJSON(text, fallback = null) {
  try {
    let s = text.trim();
    const fenceOpen  = s.indexOf('```');
    const fenceClose = s.lastIndexOf('```');
    if (fenceOpen !== -1 && fenceClose > fenceOpen) {
      s = s.slice(s.indexOf('\n', fenceOpen) + 1, fenceClose).trim();
    }
    const firstArr = s.indexOf('[');
    const firstObj = s.indexOf('{');
    if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
      s = s.slice(firstArr, s.lastIndexOf(']') + 1);
    } else if (firstObj !== -1) {
      s = s.slice(firstObj, s.lastIndexOf('}') + 1);
    }
    return JSON.parse(s);
  } catch {
    return fallback;
  }
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

export async function generateContentIdeasStructured(apiKey, posts, platform, contentType, tone, count = 5) {
  const context = buildPostContext(posts.filter(p => !platform || p.platform === platform));

  const messages = [
    {
      role: 'system',
      content: 'Eres un estratega creativo de redes sociales. Responde SIEMPRE con un JSON válido sin texto adicional ni markdown.',
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

Responde ÚNICAMENTE con este JSON array de exactamente ${count} elementos:
[
  {
    "title": "Gancho principal corto y poderoso (máx 10 palabras)",
    "concept": "Concepto en exactamente 2 oraciones.",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "reason": "Por qué funcionará según mis datos en 1 oración.",
    "contentType": "reel",
    "viralityScore": 85,
    "viralityReason": "Razón del potencial viral en 1 oración."
  }
]`,
    },
  ];

  const text = await chat(apiKey, messages, 2800, 0.8);
  const parsed = parseJSON(text, []);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No se pudo interpretar la respuesta de IA. Intenta de nuevo.');
  }
  return parsed;
}

export async function detectNiche(apiKey, posts) {
  if (posts.length === 0) return 'contenido general';

  const sample = posts
    .slice(0, 20)
    .map(p => `"${(p.caption || '').slice(0, 100)}"`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: 'Eres un experto en análisis de contenido digital. Responde siempre en español.',
    },
    {
      role: 'user',
      content: `Analiza estas captions y responde SOLO con el nicho principal del creador (2-4 palabras, sin puntuación, en minúsculas):

${sample}

Responde únicamente con el nicho, sin explicaciones ni puntuación.`,
    },
  ];

  const result = await chat(apiKey, messages, 60, 0.3);
  return result.trim().toLowerCase().replace(/[.,;:!?]/g, '');
}

export async function analyzeViralContent(apiKey, viralPost, userPosts) {
  const context = buildPostContext(userPosts.slice(0, 8));

  const postInfo = `Plataforma: ${viralPost.platform}
Tipo: ${viralPost.type}
Creador: ${viralPost.creator}
Caption: "${viralPost.caption}"
Hashtags: ${(viralPost.hashtags || []).slice(0, 8).join(', ')}
Likes: ${(viralPost.likes || 0).toLocaleString('es-MX')}
Vistas: ${(viralPost.views || 0).toLocaleString('es-MX')}
Comentarios: ${(viralPost.comments || 0).toLocaleString('es-MX')}`;

  const messages = [
    {
      role: 'system',
      content: 'Eres un analista experto en contenido viral. Responde SIEMPRE con JSON válido sin markdown ni texto adicional.',
    },
    {
      role: 'user',
      content: `Analiza este post viral en profundidad:

${postInfo}

MI CONTEXTO (mis mejores posts):
${context || 'Creador sin datos previos.'}

Responde ÚNICAMENTE con este JSON (todos los campos en español):
{
  "hook": "Análisis detallado del gancho psicológico usado en 2-3 oraciones",
  "retentionTactics": [
    "Táctica de retención detallada 1",
    "Táctica de retención detallada 2",
    "Táctica de retención detallada 3",
    "Táctica de retención detallada 4"
  ],
  "hashtagAnalysis": "Análisis de la estrategia de hashtags y copy en 2-3 oraciones",
  "replicationGuide": "Guía detallada para replicar este éxito de forma única para mi nicho en 3-4 oraciones"
}`,
    },
  ];

  const text = await chat(apiKey, messages, 1400, 0.65);
  const parsed = parseJSON(text, null);
  if (!parsed || !parsed.hook) {
    throw new Error('No se pudo analizar el contenido. Intenta de nuevo.');
  }
  return parsed;
}

export async function generateProductionKit(apiKey, scheduledPost, userPosts) {
  const avgEng = userPosts.length > 0
    ? Math.round(userPosts.reduce((s, p) => s + p.engagement, 0) / userPosts.length)
    : 0;

  const contentType = scheduledPost.contentType || 'reel';

  const productionSchema = {
    reel: `"production": {
      "type": "reel",
      "script": [
        {"segment": "0-3s",  "dialogue": "Texto exacto del gancho de apertura", "broll": "Descripción específica de la toma visual"},
        {"segment": "3-10s", "dialogue": "Desarrollo del valor principal",       "broll": "Descripción visual concreta"},
        {"segment": "10-20s","dialogue": "Punto de mayor impacto",               "broll": "Toma de acción sugerida"},
        {"segment": "20-30s","dialogue": "Cierre y llamada a la acción",         "broll": "Toma final sugerida"}
      ]
    }`,
    carousel: `"production": {
      "type": "carousel",
      "frames": [
        {"frame": 1, "text": "Portada impactante",   "imagePrompt": "Prompt detallado para generar imagen con IA"},
        {"frame": 2, "text": "Contenido slide 2",    "imagePrompt": "Prompt imagen IA detallado"},
        {"frame": 3, "text": "Contenido slide 3",    "imagePrompt": "Prompt imagen IA detallado"},
        {"frame": 4, "text": "Contenido slide 4",    "imagePrompt": "Prompt imagen IA detallado"},
        {"frame": 5, "text": "Contenido slide 5",    "imagePrompt": "Prompt imagen IA detallado"},
        {"frame": 6, "text": "CTA final y guardar",  "imagePrompt": "Prompt imagen IA detallado"}
      ]
    }`,
    story: `"production": {
      "type": "story",
      "steps": [
        {"step": 1, "text": "Pantalla de apertura",    "imagePrompt": "Prompt fondo IA", "stickers": "Encuesta o sticker sugerido"},
        {"step": 2, "text": "Contenido principal",     "imagePrompt": "Prompt fondo IA", "stickers": "Sticker de interacción"},
        {"step": 3, "text": "Reveal o cierre con CTA", "imagePrompt": "Prompt fondo IA", "stickers": "Sticker link o pregunta"}
      ]
    }`,
    post: `"production": {
      "type": "post",
      "imagePrompt": "Prompt detallado para generar imagen perfecta con IA para esta publicación",
      "editingTips": [
        "Consejo de edición específico 1",
        "Consejo de edición específico 2",
        "Consejo de edición específico 3"
      ]
    }`,
  };

  const messages = [
    {
      role: 'system',
      content: 'Eres el mejor productor de contenido viral hispanohablante. Responde SOLO con JSON válido sin markdown ni texto adicional.',
    },
    {
      role: 'user',
      content: `Genera el Kit de Producción completo para:

IDEA: "${scheduledPost.title}"
CONCEPTO: "${scheduledPost.concept}"
TIPO: ${contentType}
HASHTAGS BASE: ${(scheduledPost.hashtags || []).join(', ')}
SCORE ESTIMADO: ${scheduledPost.viralityScore || 75}/100

CONTEXTO:
• Interacción promedio: ${avgEng.toLocaleString('es-MX')}
• Publicaciones analizadas: ${userPosts.length}

Responde ÚNICAMENTE con este JSON (completa TODOS los campos con contenido real y específico en español):
{
  "copy": "Copy completo y optimizado para publicar con emojis estratégicos",
  "hashtags": ["#h1","#h2","#h3","#h4","#h5","#h6","#h7","#h8","#h9","#h10"],
  "recommendedTime": "HH:MM - HH:MM — explicación breve del porqué",
  "viralityScore": 85,
  "viralityReason": "Explicación del potencial viral en 2 oraciones",
  ${productionSchema[contentType] || productionSchema.reel}
}`,
    },
  ];

  const text = await chat(apiKey, messages, 2800, 0.72);
  const parsed = parseJSON(text, null);
  if (!parsed || !parsed.copy) {
    throw new Error('No se pudo generar el Kit de Producción. Intenta de nuevo.');
  }
  return parsed;
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
