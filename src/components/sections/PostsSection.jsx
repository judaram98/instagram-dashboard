import { useState, useMemo, useRef } from 'react';
import { useApp } from '../../store/appStore';
import { fmtNumber, fmtDate } from '../../utils/format';
import { proxyImage } from '../../utils/proxyImage';

const PLATFORM_STYLES = {
  instagram: { badge: 'badge-instagram', label: 'IG', bg: 'from-purple-500 to-pink-600' },
  tiktok:    { badge: 'badge-tiktok',    label: 'TT', bg: 'from-zinc-600 to-zinc-800' },
  youtube:   { badge: 'badge-youtube',   label: 'YT', bg: 'from-red-500 to-red-700' },
};

const TYPE_ICONS = {
  video: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
  ),
  reel: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
  image: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  ),
  carousel: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  sidecar: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  short: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
};

function Metric({ icon, value }) {
  return (
    <span className="flex items-center gap-1 text-xs text-text-muted">
      {icon}
      <span className="font-medium text-text-secondary">{fmtNumber(value)}</span>
    </span>
  );
}

// ── Media sub-components ──────────────────────────────────────────────────────

function MediaSkeleton() {
  return <div className="media-skeleton" />;
}

function MediaFallback() {
  return (
    <div className="media-fallback-glass">
      <svg
        className="w-8 h-8 text-text-faint"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  );
}

function ImageMedia({ src, alt }) {
  const proxied = proxyImage(src, 600);
  const [status, setStatus] = useState(proxied ? 'loading' : 'error');
  return (
    <div className="media-container">
      {status === 'loading' && <MediaSkeleton />}
      {status === 'error'   && <MediaFallback />}
      {proxied && (
        <img
          src={proxied}
          alt={alt}
          className={`media-img ${status === 'loaded' ? 'media-img-visible' : 'media-img-hidden'}`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </div>
  );
}

function VideoMedia({ videoUrl, poster, alt }) {
  const proxiedPoster = proxyImage(poster, 600);
  const videoRef = useRef(null);
  const [playing, setPlaying]     = useState(false);
  const [imgStatus, setImgStatus] = useState(proxiedPoster ? 'loading' : 'error');

  function startPlay() {
    if (!videoUrl) return;
    videoRef.current?.play().catch(() => {});
    setPlaying(true);
  }

  function stopPlay() {
    videoRef.current?.pause();
    if (videoRef.current) videoRef.current.currentTime = 0;
    setPlaying(false);
  }

  return (
    <div className="media-container" onMouseEnter={startPlay} onMouseLeave={stopPlay}>
      {imgStatus === 'loading' && !playing && <MediaSkeleton />}
      {imgStatus === 'error'   && !proxiedPoster && !playing && <MediaFallback />}

      {proxiedPoster && (
        <img
          src={proxiedPoster}
          alt={alt}
          className={`media-img ${imgStatus === 'loaded' && !playing ? 'media-img-visible' : 'media-img-hidden'}`}
          onLoad={() => setImgStatus('loaded')}
          onError={() => setImgStatus('error')}
        />
      )}

      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          referrerPolicy="no-referrer"
          className={`media-img ${playing ? 'media-img-visible' : 'media-img-hidden'}`}
        />
      )}

      <div className={`video-play-overlay ${playing ? 'video-play-overlay-hidden' : ''}`}>
        <div className="video-play-btn">
          <svg
            className="w-4 h-4 text-[#098058] ml-0.5"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M3 2.69a1.5 1.5 0 012.3-1.269l7.4 5.31a1.5 1.5 0 010 2.538L5.3 14.579A1.5 1.5 0 013 13.31V2.69z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function CarouselSlideImage({ src, alt }) {
  const proxied = proxyImage(src, 600);
  const [status, setStatus] = useState(proxied ? 'loading' : 'error');
  return (
    <>
      {status === 'loading' && <MediaSkeleton />}
      {status === 'error'   && <MediaFallback />}
      {proxied && (
        <img
          src={proxied}
          alt={alt}
          className={`media-img ${status === 'loaded' ? 'media-img-visible' : 'media-img-hidden'}`}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
    </>
  );
}

function CarouselMedia({ images, alt }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);

  if (!images?.length) return <ImageMedia src={null} alt={alt} />;
  if (images.length === 1) return <ImageMedia src={images[0]} alt={alt} />;

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setActiveIdx(Math.round(scrollLeft / clientWidth));
  }

  function goTo(idx) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: idx * scrollRef.current.clientWidth, behavior: 'smooth' });
    setActiveIdx(idx);
  }

  return (
    <div className="media-container">
      <div ref={scrollRef} className="carousel-snap" onScroll={handleScroll}>
        {images.map((url, i) => (
          <div key={i} className="carousel-slide">
            <CarouselSlideImage src={url} alt={`${alt} ${i + 1}`} />
          </div>
        ))}
      </div>
      <div className="carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            className={`carousel-dot ${i === activeIdx ? 'carousel-dot-active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

function MediaRenderer({ post }) {
  const type       = post.type?.toLowerCase() || '';
  const isVideo    = type === 'video' || type === 'reel' || type === 'short';
  const isCarousel = type === 'carousel' || type === 'sidecar' || (Array.isArray(post.images) && post.images.length > 1);

  if (isVideo) {
    return (
      <VideoMedia
        videoUrl={post.videoUrl}
        poster={post.thumbnail || post.displayUrl}
        alt={post.caption?.slice(0, 60) || 'Video'}
      />
    );
  }
  if (isCarousel && Array.isArray(post.images) && post.images.length > 0) {
    return (
      <CarouselMedia
        images={post.images}
        alt={post.caption?.slice(0, 60) || 'Carrusel'}
      />
    );
  }
  return (
    <ImageMedia
      src={post.thumbnail || post.displayUrl || null}
      alt={post.caption?.slice(0, 60) || 'Publicación'}
    />
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({ post }) {
  const style = PLATFORM_STYLES[post.platform] || PLATFORM_STYLES.instagram;
  return (
    <div className="card card-hover overflow-hidden group">
      <div className="relative">
        <MediaRenderer post={post} />
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className={`badge ${style.badge}`}>{post.platform}</span>
          {TYPE_ICONS[post.type] && (
            <span className="badge post-type-badge">
              {TYPE_ICONS[post.type]}
              {post.type}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {post.caption && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3 leading-relaxed">{post.caption}</p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <Metric
            icon={
              <svg className="w-3 h-3 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            }
            value={post.likes}
          />
          <Metric
            icon={
              <svg className="w-3 h-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            }
            value={post.comments}
          />
          {post.views > 0 && (
            <Metric
              icon={
                <svg className="w-3 h-3 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              }
              value={post.views}
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 post-card-footer">
          <span className="text-xs text-text-muted">{fmtDate(post.timestamp)}</span>
          <span className="post-engagement-badge">{fmtNumber(post.engagement)} interac.</span>
        </div>
      </div>
    </div>
  );
}

// ── Filters / Sort ────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'engagement', label: 'Interacción' },
  { value: 'likes',      label: 'Me gusta' },
  { value: 'comments',   label: 'Comentarios' },
  { value: 'views',      label: 'Vistas' },
  { value: 'date',       label: 'Más recientes' },
];

const TYPE_FILTERS = ['all', 'video', 'reel', 'image', 'carousel', 'sidecar', 'short'];

const TYPE_LABELS = {
  all:      'Todos',
  video:    'Video',
  reel:     'Reel',
  image:    'Imagen',
  carousel: 'Carrusel',
  sidecar:  'Carrusel',
  short:    'Short',
};

export default function PostsSection() {
  const { state } = useApp();
  const { posts, credentials } = state;

  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter]         = useState('all');
  const [sortBy, setSortBy]                 = useState('engagement');
  const [search, setSearch]                 = useState('');

  const enabledPlatforms = Object.entries(credentials.platforms)
    .filter(([, p]) => p?.enabled)
    .map(([k]) => k);

  const uniqueTypeFilters = useMemo(() => {
    const present = new Set(posts.map(p => p.type?.toLowerCase()).filter(Boolean));
    return TYPE_FILTERS.filter(t => t === 'all' || present.has(t));
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (platformFilter !== 'all') result = result.filter(p => p.platform === platformFilter);
    if (typeFilter     !== 'all') result = result.filter(p => p.type?.toLowerCase() === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.caption?.toLowerCase().includes(q) ||
        p.hashtags?.some(h => h.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.timestamp) - new Date(a.timestamp);
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });
  }, [posts, platformFilter, typeFilter, sortBy, search]);

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="section-title">Publicaciones</h1>
        <div className="card p-12 text-center">
          <p className="text-text-secondary text-sm">Sin publicaciones — sincroniza tus datos desde el panel lateral.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Publicaciones</h1>
        <p className="text-text-secondary mt-2 text-sm">{filtered.length} de {posts.length} publicaciones</p>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="input-field pl-10 py-2.5"
              placeholder="Buscar por descripción o hashtag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto py-2.5 pr-8"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Ordenar: {o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="label mr-1">Plataforma:</div>
          {['all', ...enabledPlatforms].map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`filter-pill ${platformFilter === p ? 'filter-pill-active' : ''}`}
            >
              {p === 'all' ? 'Todas' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <span className="w-px h-4 mx-1 filter-separator" />
          <div className="label mr-1">Tipo:</div>
          {uniqueTypeFilters.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`filter-pill ${typeFilter === t ? 'filter-pill-active' : ''}`}
            >
              {TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-text-secondary text-sm">Ninguna publicación coincide con tus filtros.</p>
          <button
            onClick={() => { setPlatformFilter('all'); setTypeFilter('all'); setSearch(''); }}
            className="btn-ghost mt-3 mx-auto"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(post => <PostCard key={`${post.platform}-${post.id}`} post={post} />)}
        </div>
      )}
    </div>
  );
}
