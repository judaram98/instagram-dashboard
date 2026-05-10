import { useState, useMemo } from 'react';
import { useApp } from '../../store/appStore';
import { fmtNumber, fmtDate } from '../../utils/format';

const PLATFORM_STYLES = {
  instagram: { badge: 'badge-instagram', label: 'IG', bg: 'from-purple-400 to-pink-500' },
  tiktok: { badge: 'badge-tiktok', label: 'TT', bg: 'from-slate-700 to-slate-900' },
  youtube: { badge: 'badge-youtube', label: 'YT', bg: 'from-red-400 to-red-600' },
};

const TYPE_ICONS = {
  video: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.553 1.106A1 1 0 0016 8v4a1 1 0 00.553.894l2 1A1 1 0 0020 13V7a1 1 0 00-1.447-.894l-2 1z" />
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
  short: (
    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
};

function Metric({ icon, value }) {
  return (
    <span className="flex items-center gap-1 text-xs text-ink-muted">
      {icon}
      <span className="font-medium text-ink">{fmtNumber(value)}</span>
    </span>
  );
}

function PostCard({ post }) {
  const [imgErr, setImgErr] = useState(false);
  const style = PLATFORM_STYLES[post.platform] || PLATFORM_STYLES.instagram;

  return (
    <div className="card card-hover overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-primary-50">
        {post.thumbnail && !imgErr ? (
          <img
            src={post.thumbnail}
            alt={post.caption?.slice(0, 40) || 'Post'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${style.bg} flex items-center justify-center`}>
            <span className="text-white/60 text-3xl font-display font-bold">{style.label}</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`badge ${style.badge}`}>{post.platform}</span>
          {TYPE_ICONS[post.type] && (
            <span className="badge bg-black/40 text-white backdrop-blur-sm border-0">
              {TYPE_ICONS[post.type]}
              {post.type}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {post.caption && (
          <p className="text-sm text-ink line-clamp-2 mb-3 leading-relaxed">{post.caption}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Metric
            icon={<svg className="w-3 h-3 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>}
            value={post.likes}
          />
          <Metric
            icon={<svg className="w-3 h-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>}
            value={post.comments}
          />
          {post.views > 0 && (
            <Metric
              icon={<svg className="w-3 h-3 text-primary-300" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>}
              value={post.views}
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-ink-faint/30">
          <span className="text-xs text-ink-muted">{fmtDate(post.timestamp)}</span>
          <span className="text-xs font-semibold text-primary bg-primary-50 px-2 py-0.5 rounded-full">
            {fmtNumber(post.engagement)} eng
          </span>
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'likes', label: 'Likes' },
  { value: 'comments', label: 'Comments' },
  { value: 'views', label: 'Views' },
  { value: 'date', label: 'Newest' },
];

const TYPE_FILTERS = ['all', 'video', 'image', 'carousel', 'short'];

export default function PostsSection() {
  const { state } = useApp();
  const { posts, credentials } = state;

  const [platformFilter, setPlatformFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('engagement');
  const [search, setSearch] = useState('');

  const enabledPlatforms = Object.entries(credentials.platforms)
    .filter(([, p]) => p.enabled)
    .map(([k]) => k);

  const filtered = useMemo(() => {
    let result = posts;
    if (platformFilter !== 'all') result = result.filter(p => p.platform === platformFilter);
    if (typeFilter !== 'all') result = result.filter(p => p.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => p.caption?.toLowerCase().includes(q) || p.hashtags?.some(h => h.toLowerCase().includes(q)));
    }
    return [...result].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.timestamp) - new Date(a.timestamp);
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    });
  }, [posts, platformFilter, typeFilter, sortBy, search]);

  if (posts.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="section-title">Posts</h1>
        <div className="card p-12 text-center">
          <p className="text-ink-muted">No posts yet — sync your data from the sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Posts</h1>
          <p className="text-ink-muted mt-1">{filtered.length} of {posts.length} posts</p>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              className="input-field pl-10 py-2.5"
              placeholder="Search by caption or hashtag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input-field w-auto py-2.5 pr-8"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="label mr-1">Platform:</div>
          {['all', ...enabledPlatforms].map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${platformFilter === p ? 'bg-primary text-white' : 'bg-ink-faint/30 text-ink-muted hover:bg-primary-50 hover:text-primary'}`}
            >
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}

          <span className="w-px h-4 bg-ink-faint mx-1" />
          <div className="label mr-1">Type:</div>
          {TYPE_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${typeFilter === t ? 'bg-primary text-white' : 'bg-ink-faint/30 text-ink-muted hover:bg-primary-50 hover:text-primary'}`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-muted">No posts match your filters.</p>
          <button onClick={() => { setPlatformFilter('all'); setTypeFilter('all'); setSearch(''); }} className="btn-ghost mt-3 mx-auto">
            Clear filters
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
