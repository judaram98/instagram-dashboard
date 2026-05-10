const MODEL = 'gpt-4o-mini';

async function chat(messages, maxTokens = 1500, temperature = 0.75) {
  const res = await fetch('/api/proxy-openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function detectNiche(posts) {
  if (posts.length === 0) return 'contenido general';

  const sample = posts
    .slice(0, 20)
    .map(p => `"${(p.caption || '').slice(0, 100)}"`)
    .join('\n');

  const messages = [
    { role: 'system', content: 'Eres un experto en análisis de contenido digital. Responde siempre en español.' },
    {
      role: 'user',
      content: `Analiza estas captions y responde SOLO con el nicho principal del creador (2-4 palabras, sin puntuación, en minúsculas):\n\n${sample}\n\nResponde únicamente con el nicho, sin explicaciones ni puntuación.`,
    },
  ];

  const result = await chat(messages, 60, 0.3);
  return result.trim().toLowerCase().replace(/[.,;:!?]/g, '');
}

export async function generateContentIdeas(posts, platform, contentType, tone, count = 5) {
  const context = buildPostContext(posts.filter(p => !platform || p.platform === platform));

  const messages = [
    {
      role: 'system',
      content: 'Eres un estratega creativo de redes sociales especializado en generar ideas de contenido para creadores hispanohablantes. Responde siempre en español.',
    },
    {
      role: 'user',
      content: `Genera ${count} ideas de contenido basadas en mis publicaciones con mejor rendimiento.\n\nMIS MEJORES PUBLICACIONES:\n${context || 'Sin datos aún.'}\n\nREQUISITOS:\n• Plataforma: ${platform || 'Cualquiera'}\n• Tipo: ${contentType || 'Cualquiera'}\n• Tono: ${tone || 'Auténtico y cercano'}\n\nPara CADA idea usa exactamente este formato:\n\n🎯 **[Título / Gancho]**\n📝 [Concepto en 2 oraciones]\n🏷️ [5 hashtags]\n💡 [Por qué funcionará]\n\n---`,
    },
  ];

  return chat(messages, 2200, 0.8);
}

export async function generateContentIdeasStructured(posts, platform, contentType, tone, count = 5) {
  const context = buildPostContext(posts.filter(p => !platform || p.platform === platform));

  const messages = [
    {
      role: 'system',
      content: 'Eres un estratega creativo de redes sociales. Responde SIEMPRE con JSON válido sin texto adicional ni markdown.',
    },
    {
      role: 'user',
      content: `Genera ${count} ideas de contenido basadas en mis publicaciones con mejor rendimiento.\n\nMIS MEJORES PUBLICACIONES:\n${context || 'Sin datos aún — sugiere ideas para un creador en crecimiento.'}\n\nREQUISITOS:\n• Plataforma: ${platform || 'Cualquiera'}\n• Tipo: ${contentType || 'Cualquiera'}\n• Tono: ${tone || 'Auténtico y cercano'}\n\nResponde ÚNICAMENTE con este JSON array de exactamente ${count} elementos:\n[\n  {\n    "title": "Gancho principal corto y poderoso (máx 10 palabras)",\n    "concept": "Concepto en exactamente 2 oraciones.",\n    "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"],\n    "reason": "Por qué funcionará según mis datos en 1 oración.",\n    "contentType": "reel",\n    "viralityScore": 85,\n    "viralityReason": "Razón del potencial viral en 1 oración."\n  }\n]`,
    },
  ];

  const text = await chat(messages, 2800, 0.8);
  const parsed = parseJSON(text, []);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('No se pudo interpretar la respuesta de IA. Intenta de nuevo.');
  }
  return parsed;
}

export async function analyzeViralContent(viralPost, userPosts) {
  const context  = buildPostContext(userPosts.slice(0, 8));
  const postInfo = `Plataforma: ${viralPost.platform}\nTipo: ${viralPost.type}\nCreador: ${viralPost.creator}\nCaption: "${viralPost.caption}"\nHashtags: ${(viralPost.hashtags || []).slice(0, 8).join(', ')}\nLikes: ${(viralPost.likes || 0).toLocaleString('es-MX')}\nVistas: ${(viralPost.views || 0).toLocaleString('es-MX')}\nComentarios: ${(viralPost.comments || 0).toLocaleString('es-MX')}`;

  const messages = [
    { role: 'system', content: 'Eres un analista experto en contenido viral. Responde SIEMPRE con JSON válido sin markdown ni texto adicional.' },
    {
      role: 'user',
      content: `Analiza este post viral en profundidad:\n\n${postInfo}\n\nMI CONTEXTO (mis mejores posts):\n${context || 'Sin datos previos.'}\n\nResponde ÚNICAMENTE con este JSON:\n{\n  "hook": "Análisis del gancho psicológico en 2-3 oraciones",\n  "retentionTactics": ["Táctica 1 detallada","Táctica 2 detallada","Táctica 3 detallada","Táctica 4 detallada"],\n  "hashtagAnalysis": "Análisis de hashtags y copy en 2-3 oraciones",\n  "replicationGuide": "Guía para replicar de forma única en 3-4 oraciones"\n}`,
    },
  ];

  const text   = await chat(messages, 1400, 0.65);
  const parsed = parseJSON(text, null);
  if (!parsed || !parsed.hook) throw new Error('No se pudo analizar el contenido. Intenta de nuevo.');
  return parsed;
}

export async function generateProductionKit(scheduledPost, userPosts) {
  const avgEng     = userPosts.length > 0
    ? Math.round(userPosts.reduce((s, p) => s + p.engagement, 0) / userPosts.length)
    : 0;
  const contentType = scheduledPost.contentType || 'reel';

  const productionSchema = {
    reel: `"production": {"type":"reel","script":[{"segment":"0-3s","dialogue":"Texto gancho apertura","broll":"Descripción toma visual"},{"segment":"3-10s","dialogue":"Desarrollo valor principal","broll":"Descripción visual"},{"segment":"10-20s","dialogue":"Punto de mayor impacto","broll":"Toma acción"},{"segment":"20-30s","dialogue":"Cierre y CTA","broll":"Toma final"}]}`,
    carousel: `"production": {"type":"carousel","frames":[{"frame":1,"text":"Portada impactante","imagePrompt":"Prompt IA detallado"},{"frame":2,"text":"Slide 2","imagePrompt":"Prompt IA"},{"frame":3,"text":"Slide 3","imagePrompt":"Prompt IA"},{"frame":4,"text":"Slide 4","imagePrompt":"Prompt IA"},{"frame":5,"text":"Slide 5","imagePrompt":"Prompt IA"},{"frame":6,"text":"CTA final","imagePrompt":"Prompt IA"}]}`,
    story: `"production": {"type":"story","steps":[{"step":1,"text":"Apertura","imagePrompt":"Prompt fondo IA","stickers":"Sticker sugerido"},{"step":2,"text":"Contenido","imagePrompt":"Prompt fondo IA","stickers":"Sticker interacción"},{"step":3,"text":"Cierre CTA","imagePrompt":"Prompt fondo IA","stickers":"Link o pregunta"}]}`,
    post: `"production": {"type":"post","imagePrompt":"Prompt detallado para imagen perfecta con IA","editingTips":["Consejo 1","Consejo 2","Consejo 3"]}`,
  };

  const messages = [
    { role: 'system', content: 'Eres el mejor productor de contenido viral hispanohablante. Responde SOLO con JSON válido sin markdown ni texto adicional.' },
    {
      role: 'user',
      content: `Genera el Kit de Producción completo para:\n\nIDEA: "${scheduledPost.title}"\nCONCEPTO: "${scheduledPost.concept}"\nTIPO: ${contentType}\nHASHTAGS BASE: ${(scheduledPost.hashtags || []).join(', ')}\nSCORE: ${scheduledPost.viralityScore || 75}/100\n\nCONTEXTO: • Interacción promedio: ${avgEng.toLocaleString('es-MX')} • Posts analizados: ${userPosts.length}\n\nResponde ÚNICAMENTE con este JSON completo:\n{\n  "copy": "Copy completo optimizado con emojis",\n  "hashtags": ["#h1","#h2","#h3","#h4","#h5","#h6","#h7","#h8","#h9","#h10"],\n  "recommendedTime": "HH:MM - HH:MM — razón breve",\n  "viralityScore": 85,\n  "viralityReason": "Explicación potencial viral en 2 oraciones",\n  ${productionSchema[contentType] || productionSchema.reel}\n}`,
    },
  ];

  const text   = await chat(messages, 2800, 0.72);
  const parsed = parseJSON(text, null);
  if (!parsed || !parsed.copy) throw new Error('No se pudo generar el Kit de Producción. Intenta de nuevo.');
  return parsed;
}

export async function sendChatMessage(history, posts, platforms = {}) {
  const enabledPlatforms = Object.entries(platforms)
    .filter(([, p]) => p.enabled)
    .map(([name]) => name)
    .join(', ');

  const avgEng = posts.length > 0
    ? Math.round(posts.reduce((s, p) => s + p.engagement, 0) / posts.length)
    : 0;

  const system = `Eres un asistente experto en analíticas de redes sociales para un creador de contenido hispanohablante.\n\nDATOS DEL CREADOR:\n• Plataformas conectadas: ${enabledPlatforms || 'ninguna aún'}\n• Total de publicaciones analizadas: ${posts.length}\n• Interacción promedio: ${avgEng.toLocaleString('es-MX')}\n\nMEJORES PUBLICACIONES:\n${buildPostContext(posts)}\n\nDa consejos específicos y basados en datos. Responde siempre en español. Mantén respuestas concisas (menos de 250 palabras salvo que pidan más detalle).`;

  const messages = [{ role: 'system', content: system }, ...history];
  return chat(messages, 800, 0.7);
}

export async function analyzeAudience(posts) {
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
    diaSemana:   ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][new Date(p.timestamp).getDay()],
    hashtags:    (p.hashtags || []).slice(0, 5),
  }));

  const messages = [
    { role: 'system', content: 'Eres un analista experto en redes sociales. Proporciona insights profundos y accionables. Responde siempre en español.' },
    {
      role: 'user',
      content: `Analiza el rendimiento de mi contenido:\n\n${JSON.stringify(sample, null, 2)}\n\nEstructura con estos encabezados:\n\n## 🧑‍💻 Comportamiento de la audiencia\n## 📊 Análisis de rendimiento del contenido\n## ⏰ Mejores horarios para publicar\n## #️⃣ Estrategia de hashtags\n## 🚀 Top 3 acciones de crecimiento\n## 🔥 Puntuación de viralidad (1–10) con explicación`,
    },
  ];

  return chat(messages, 2000, 0.65);
}

export async function predictVirality(concept, posts) {
  const avgEng   = posts.length > 0 ? Math.round(posts.reduce((s, p) => s + p.engagement, 0) / posts.length) : 0;
  const avgViews = posts.length > 0 ? Math.round(posts.reduce((s, p) => s + (p.views || 0), 0) / posts.length) : 0;
  const topTags  = Object.entries(
    posts.flatMap(p => p.hashtags || []).reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t);

  const messages = [
    { role: 'system', content: 'Eres un experto en predicción de contenido viral. Proporciona predicciones numéricas específicas. Responde en español.' },
    {
      role: 'user',
      content: `Predice el potencial viral de:\n\nCONCEPTO: "${concept}"\n\nMI LÍNEA BASE:\n• Interacción promedio: ${avgEng.toLocaleString('es-MX')}\n• Vistas promedio: ${avgViews.toLocaleString('es-MX')}\n• Posts analizados: ${posts.length}\n• Mejores hashtags: ${topTags.join(', ') || 'ninguno aún'}\n\nFormato exacto:\n\n## 🎯 Puntuación viral: X/100\n\n## 📈 Interacción predicha: [número]\n## 👁️ Alcance predicho: [número]\n\n## ✅ Fortalezas\n[3 puntos]\n\n## ⚠️ Riesgos\n[2 puntos]\n\n## ✨ Gancho optimizado\n"[versión mejorada]"\n\n## 🏷️ Hashtags recomendados\n[10 hashtags]`,
    },
  ];

  return chat(messages, 1200, 0.65);
}
