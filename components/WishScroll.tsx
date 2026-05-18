import React, { useCallback, useEffect, useRef, useState } from 'react';
import FishIllustration from './FishIllustration';
import { Feeding, Fish, fishService } from '../services/supabaseService';

type FeedViewMode = 'cards' | 'list';
type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'quarter';

interface FishStreamProps {
  isNightMode?: boolean;
  refreshKey?: number;
  onTotalMeritChange?: (merit: number) => void;
}

const formatFeedingTime = (value?: string) => {
  if (!value) {
    return '刚刚';
  }
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

type IconProps = { className?: string };

const ArchiveIcon = ({ className = 'h-5 w-5' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17.5A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20H6.5A2.5 2.5 0 0 1 4 17.5v-10Z" />
    <path d="M8 9h8" />
    <path d="M8 13h8" />
  </svg>
);

const FishIcon = ({ className = 'h-4.5 w-4.5' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4.5 12c2-3.2 5.1-5.2 8.5-5.2 2.9 0 5.2 1 7 2.3-.8.9-1.2 1.9-1.2 2.9s.4 2 1.2 2.9c-1.8 1.3-4.1 2.3-7 2.3-3.4 0-6.5-2-8.5-5.2Z" />
    <path d="M4.5 12 2 9.5M4.5 12 2 14.5" />
    <circle cx="13.8" cy="11.2" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const CardsIcon = ({ className = 'h-4.5 w-4.5' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3.5" y="4" width="7.5" height="7.5" rx="1.6" />
    <rect x="13" y="4" width="7.5" height="7.5" rx="1.6" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" />
  </svg>
);

const ListIcon = ({ className = 'h-4.5 w-4.5' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M8 6h11" />
    <path d="M8 12h11" />
    <path d="M8 18h11" />
    <circle cx="4.2" cy="6" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="4.2" cy="12" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="4.2" cy="18" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

const ClockIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 8v4l2.6 1.5" />
  </svg>
);

const MeritIcon = ({ className = 'h-4 w-4' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3.5 9.2 8.7 3.5 9.6l4.1 4-1 5.7L12 16.5l5.4 2.8-1-5.7 4.1-4-5.7-.9L12 3.5Z" />
  </svg>
);

const WaterIcon = ({ className = 'h-6 w-6' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 6c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0" />
    <path d="M2 12c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0" />
    <path d="M2 18c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0 3.5 1 5 0" />
  </svg>
);

const PAGE_SIZE = 12;

const getTimeRange = (filter: TimeFilter): { startDate?: string; endDate?: string } => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter) {
    case 'today': {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() };
    }
    case 'week': {
      const day = now.getDay() || 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
      return { startDate: startOfWeek.toISOString(), endDate: endOfDay.toISOString() };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth.toISOString(), endDate: endOfDay.toISOString() };
    }
    case 'quarter': {
      const startOfQuarter = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { startDate: startOfQuarter.toISOString(), endDate: endOfDay.toISOString() };
    }
    default:
      return {};
  }
};

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '近三月' },
];

const FishStream: React.FC<FishStreamProps> = ({ isNightMode = false, refreshKey, onTotalMeritChange }) => {
  const [viewMode, setViewMode] = useState<FeedViewMode>('cards');
  const [fishMap, setFishMap] = useState<Map<string, Fish>>(new Map());
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalMerit, setTotalMerit] = useState(0);
  const refreshKeyRef = useRef(refreshKey);

  // Fetch fish catalog once
  useEffect(() => {
    let alive = true;
    fishService.getFishCatalog().then((catalog) => {
      if (!alive) return;
      const map = new Map<string, Fish>();
      catalog.forEach((fish) => map.set(fish.id, fish));
      setFishMap(map);
    });
    return () => { alive = false; };
  }, []);

  // Fetch total merit once
  useEffect(() => {
    fishService.getTotalMerit().then((merit) => {
      setTotalMerit(merit);
      onTotalMeritChange?.(merit);
    });
  }, []);

  // Fetch feedings when filter/page changes
  const fetchFeedings = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    const range = getTimeRange(timeFilter);
    const result = await fishService.getRecentFeedings({
      ...range,
      page,
      pageSize: PAGE_SIZE,
    });
    setFeedings(result.items);
    setTotal(result.total);
    setIsLoading(false);
    setIsInitialLoad(false);
  }, [timeFilter, page]);

  useEffect(() => {
    fetchFeedings();
  }, [fetchFeedings]);

  // Refresh when refreshKey changes (new feeding submitted)
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey !== refreshKeyRef.current) {
      refreshKeyRef.current = refreshKey;
      setPage(1);
      // Re-fetch with updated filter
      const range = getTimeRange(timeFilter);
      fishService.getRecentFeedings({ ...range, page: 1, pageSize: PAGE_SIZE }).then((result) => {
        setFeedings(result.items);
        setTotal(result.total);
      });
      // Also refresh total merit
      fishService.getTotalMerit().then((merit) => {
        setTotalMerit(merit);
        onTotalMeritChange?.(merit);
      });
    }
  }, [refreshKey]);

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    setPage(1);
  };

  const isCardMode = viewMode === 'cards';

  // Color tokens
  const t = {
    shell: isNightMode
      ? 'border-white/[0.08] bg-[#0a0f1a]/90 text-slate-100'
      : 'border-slate-200/60 bg-white/80 text-slate-900',
    backdrop: isNightMode
      ? 'bg-[radial-gradient(ellipse_at_20%_0%,rgba(34,211,238,0.08),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(16,185,129,0.05),transparent_50%)]'
      : 'bg-[radial-gradient(ellipse_at_20%_0%,rgba(14,165,233,0.06),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(16,185,129,0.04),transparent_50%)]',
    divider: isNightMode ? 'border-white/[0.06]' : 'border-slate-200/60',
    eyebrow: isNightMode
      ? 'bg-white/[0.06] text-slate-400'
      : 'bg-slate-100 text-slate-500',
    title: isNightMode ? 'text-white' : 'text-slate-900',
    subtitle: isNightMode ? 'text-slate-400' : 'text-slate-500',
    statValue: isNightMode ? 'text-white' : 'text-slate-900',
    statLabel: isNightMode ? 'text-slate-500' : 'text-slate-400',
    statDiv: isNightMode ? 'bg-white/[0.08]' : 'bg-slate-200/60',
    toggleShell: isNightMode
      ? 'bg-white/[0.06] border-white/[0.08]'
      : 'bg-slate-100/80 border-slate-200/60',
    toggleActive: isNightMode
      ? 'bg-white/[0.12] text-white'
      : 'bg-white text-slate-900 shadow-sm',
    toggleInactive: isNightMode
      ? 'text-slate-500 hover:text-slate-300'
      : 'text-slate-400 hover:text-slate-600',
    card: isNightMode
      ? 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1]'
      : 'border-slate-200/50 bg-white/60 hover:bg-white hover:border-slate-200',
    cardLatest: isNightMode
      ? 'border-cyan-500/25 bg-cyan-500/[0.05] hover:bg-cyan-500/[0.08] hover:border-cyan-500/35'
      : 'border-sky-300/40 bg-sky-50/50 hover:bg-sky-50 hover:border-sky-300/60',
    cardAccent: isNightMode
      ? 'bg-gradient-to-b from-cyan-400 to-emerald-400'
      : 'bg-gradient-to-b from-sky-500 to-cyan-400',
    cardAccentMuted: isNightMode
      ? 'bg-white/[0.08]'
      : 'bg-slate-200/60',
    iconWrap: isNightMode
      ? 'bg-white/[0.06] border-white/[0.08] text-slate-300'
      : 'bg-slate-50 border-slate-200/60 text-slate-600',
    iconWrapLatest: isNightMode
      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
      : 'bg-sky-50 border-sky-200/50 text-sky-600',
    username: isNightMode ? 'text-white' : 'text-slate-900',
    usernameMuted: isNightMode ? 'text-slate-400' : 'text-slate-400',
    quoteArea: isNightMode
      ? 'bg-white/[0.03] border-white/[0.05]'
      : 'bg-slate-50/50 border-slate-100/60',
    quoteAccent: isNightMode ? 'text-cyan-400/30' : 'text-sky-300/60',
    quoteLabel: isNightMode ? 'text-slate-500' : 'text-slate-400',
    quoteText: isNightMode ? 'text-slate-200' : 'text-slate-700',
    meritBadge: isNightMode
      ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
      : 'bg-sky-50 border-sky-200/50 text-sky-700',
    meritBadgeLatest: isNightMode
      ? 'bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 border-cyan-400/25 text-cyan-200'
      : 'bg-gradient-to-r from-sky-100/80 to-cyan-50/60 border-sky-300/50 text-sky-700',
    timeBadge: isNightMode
      ? 'text-slate-500'
      : 'text-slate-400',
    latestTag: isNightMode
      ? 'bg-cyan-500/10 text-cyan-400'
      : 'bg-sky-50 text-sky-600',
    timelineLine: isNightMode
      ? 'bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent'
      : 'bg-gradient-to-b from-slate-200 via-slate-100 to-transparent',
    timelineDot: isNightMode ? 'bg-slate-600' : 'bg-slate-300',
    timelineDotLatest: isNightMode ? 'bg-cyan-400' : 'bg-sky-500',
    emptyIconBg: isNightMode
      ? 'bg-white/[0.04] border-white/[0.08] text-slate-500'
      : 'bg-slate-50 border-slate-200/60 text-slate-400',
    emptyTitle: isNightMode ? 'text-slate-300' : 'text-slate-600',
    emptyText: isNightMode ? 'text-slate-500' : 'text-slate-400',
    skeletonLine: isNightMode ? 'bg-white/[0.06]' : 'bg-slate-200/50',
    skeletonBlock: isNightMode ? 'bg-white/[0.04]' : 'bg-slate-100/50',
  };

  // Card illustration palettes
  const cardPalettes = [
    { from: '#0ea5e9', to: '#06b6d4' },
    { from: '#10b981', to: '#34d399' },
    { from: '#6366f1', to: '#818cf8' },
    { from: '#f59e0b', to: '#fbbf24' },
    { from: '#ec4899', to: '#f472b6' },
    { from: '#8b5cf6', to: '#a78bfa' },
  ];

  const renderCardItem = (feeding: Feeding, index: number) => {
    const isLatest = index === 0;
    const username = feeding.feederName?.trim() || '匿名喂鱼人';
    const description = feeding.wishDescription || feeding.foodLabel;
    const timeLabel = formatFeedingTime(feeding.created_at);
    const fish = fishMap.get(feeding.fishId);
    const fishImageUrl = fish?.fishType?.imageUrl;
    const fishName = fish?.name;
    const palette = cardPalettes[index % cardPalettes.length];

    return (
      <article
        key={feeding.id}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none motion-reduce:hover:shadow-none ${
          isLatest ? t.cardLatest : t.card
        }`}
      >
        {/* Image area */}
        <div className="relative overflow-hidden">
          {fishImageUrl ? (
            <img
              src={fishImageUrl}
              alt={fishName || '鱼'}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
          ) : (
            <FishIllustration
              accentFrom={fish?.fishType?.accentFrom || palette.from}
              accentTo={fish?.fishType?.accentTo || palette.to}
              variant={fish?.displayOrder || index}
              isNightMode={isNightMode}
              className="aspect-[16/9] w-full"
            />
          )}
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${isNightMode ? 'from-[#0a0f1a]/90 via-[#0a0f1a]/20 to-transparent' : 'from-white/90 via-white/20 to-transparent'}`} />
          {/* Fish name tag */}
          {fishName && (
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md ${t.latestTag}`}>
                <FishIcon className="h-3 w-3" />
                {fishName}
              </span>
            </div>
          )}
          {/* Merit badge on image */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${isLatest ? t.meritBadgeLatest : t.meritBadge}`}>
              <MeritIcon className="h-3.5 w-3.5" />
              功德 +{feeding.meritEarned}
            </span>
          </div>
          {/* Latest badge */}
          {isLatest && (
            <div className="absolute top-3 right-3">
              <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wider backdrop-blur-md ${t.latestTag}`}>最新</span>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Wish text */}
          <blockquote className={`flex-1 font-brand text-[15px] leading-[1.8] tracking-tight ${t.quoteText}`}>
            <span className={`mr-0.5 text-xl opacity-20 ${t.quoteAccent}`}>&ldquo;</span>
            <span className="line-clamp-3">{description}</span>
            <span className={`ml-0.5 text-xl opacity-20 ${t.quoteAccent}`}>&rdquo;</span>
          </blockquote>

          {/* Footer: user + time */}
          <div className={`flex items-center justify-between gap-2 border-t ${t.divider} pt-3`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${isLatest ? t.iconWrapLatest : t.iconWrap}`}>
                <FishIcon className="h-3.5 w-3.5" />
              </div>
              <p className={`truncate font-brand text-sm font-medium tracking-tight ${t.username}`}>{username}</p>
            </div>
            <span className={`flex shrink-0 items-center gap-1 text-[11px] ${t.timeBadge}`}>
              <ClockIcon className="h-3 w-3" />
              {timeLabel}
            </span>
          </div>
        </div>
      </article>
    );
  };

  const renderListItem = (feeding: Feeding, index: number) => {
    const isLatest = index === 0;
    const username = feeding.feederName?.trim() || '匿名喂鱼人';
    const description = feeding.wishDescription || feeding.foodLabel;
    const timeLabel = formatFeedingTime(feeding.created_at);

    return (
      <div key={feeding.id} className="relative flex gap-4 sm:gap-5">
        {/* Timeline node */}
        <div className="relative flex flex-col items-center pt-4">
          <div className={`relative z-10 h-2.5 w-2.5 rounded-full ${isLatest ? t.timelineDotLatest : t.timelineDot}`}>
            {isLatest && <div className={`absolute inset-0 animate-ping rounded-full opacity-40 ${t.timelineDotLatest}`} />}
          </div>
          {index < feedings.length - 1 && <div className={`w-px flex-1 ${t.timelineLine}`} />}
        </div>

        {/* List card */}
        <article
          className={`group relative mb-3 flex min-w-0 flex-1 items-center gap-4 overflow-hidden rounded-xl border px-4 py-3.5 transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-md motion-reduce:transform-none motion-reduce:hover:shadow-none sm:gap-5 sm:px-5 sm:py-4 ${
            isLatest ? t.cardLatest : t.card
          }`}
        >
          {/* Left accent rail */}
          <div className={`absolute inset-y-0 left-0 w-[3px] ${isLatest ? t.cardAccent : t.cardAccentMuted}`} />

          {/* Icon */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${isLatest ? t.iconWrapLatest : t.iconWrap}`}>
            <FishIcon className="h-4 w-4" />
          </div>

          {/* Username + time */}
          <div className="w-28 shrink-0 sm:w-32">
            <p className={`truncate font-brand text-sm font-medium tracking-tight ${t.username}`}>
              {username}
              {isLatest && (
                <span className={`ml-1.5 inline-block rounded-full px-1.5 py-px text-[9px] font-medium tracking-wide align-middle ${t.latestTag}`}>最新</span>
              )}
            </p>
            <p className={`mt-0.5 flex items-center gap-1 text-[11px] ${t.timeBadge}`}>
              <ClockIcon className="h-3 w-3 shrink-0" />
              <span className="truncate">{timeLabel}</span>
            </p>
          </div>

          {/* Wish text */}
          <blockquote className={`min-w-0 flex-1 font-brand text-[14px] leading-[1.7] tracking-tight ${t.quoteText}`}>
            <span className={`mr-0.5 text-lg opacity-20 ${t.quoteAccent}`}>&ldquo;</span>
            <span className="line-clamp-1">{description}</span>
            <span className={`ml-0.5 text-lg opacity-20 ${t.quoteAccent}`}>&rdquo;</span>
          </blockquote>

          {/* Merit badge */}
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${isLatest ? t.meritBadgeLatest : t.meritBadge}`}>
            <MeritIcon className="h-3.5 w-3.5" />
            +{feeding.meritEarned}
          </span>
        </article>
      </div>
    );
  };

  // Main content
  return (
    <div className="mx-auto max-w-6xl">
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl ${t.shell}`}>
        <div className={`pointer-events-none absolute inset-0 ${t.backdrop}`} aria-hidden="true" />

        {/* Header */}
        <div className={`flex flex-col gap-4 border-b ${t.divider} px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6`}>
          <div className="flex items-center gap-3.5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${t.iconWrap}`}>
              <ArchiveIcon className="h-5 w-5" />
            </div>
            <div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-[0.2em] uppercase ${t.eyebrow}`}>
                功德记录
              </span>
              <h3 className={`mt-1.5 font-brand text-2xl font-semibold tracking-tight ${t.title}`}>功德记录</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className={`flex items-center divide-x ${t.statDiv} rounded-lg border ${t.divider} overflow-hidden`}>
              <div className="px-4 py-2.5 text-center">
                <p className={`text-[10px] font-medium tracking-[0.15em] uppercase ${t.statLabel}`}>累计功德</p>
                <p className={`mt-0.5 font-brand text-lg font-semibold tabular-nums ${t.statValue}`}>{totalMerit}</p>
              </div>
              <div className="px-4 py-2.5 text-center">
                <p className={`text-[10px] font-medium tracking-[0.15em] uppercase ${t.statLabel}`}>记录</p>
                <p className={`mt-0.5 font-brand text-lg font-semibold tabular-nums ${t.statValue}`}>{total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time filter + view toggle row */}
        <div className={`flex flex-wrap items-center gap-2 border-b ${t.divider} px-5 py-3 sm:px-6`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {TIME_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTimeFilterChange(key)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  timeFilter === key ? t.toggleActive : t.toggleInactive
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* View toggle */}
            <div className={`inline-flex items-center gap-0.5 rounded-full border p-1 ${t.toggleShell}`} role="tablist" aria-label="切换展示模式">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-pressed={isCardMode}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${isCardMode ? t.toggleActive : t.toggleInactive}`}
              >
                <CardsIcon className="h-3.5 w-3.5" />
                卡片
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={!isCardMode}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${isCardMode ? t.toggleInactive : t.toggleActive}`}
              >
                <ListIcon className="h-3.5 w-3.5" />
                列表
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {isInitialLoad ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`relative overflow-hidden rounded-2xl border ${t.skeletonLine}`}>
                  <div className={`aspect-[16/9] ${t.skeletonBlock}`} />
                  <div className="p-4 space-y-3">
                    <div className={`h-2.5 w-10 rounded-full ${t.skeletonBlock}`} />
                    <div className={`h-4 w-full rounded-full ${t.skeletonLine}`} />
                    <div className={`h-4 w-3/4 rounded-full ${t.skeletonLine}`} />
                    <div className={`border-t ${t.divider} pt-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-lg ${t.skeletonBlock}`} />
                        <div className={`h-3.5 w-16 rounded-full ${t.skeletonBlock}`} />
                      </div>
                      <div className={`h-3 w-20 rounded-full ${t.skeletonBlock}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : feedings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${t.emptyIconBg}`}>
                <WaterIcon className="h-6 w-6" />
              </div>
              <h3 className={`mt-5 font-brand text-lg font-medium tracking-tight ${t.emptyTitle}`}>暂无记录</h3>
              <p className={`mt-2 max-w-xs text-sm leading-relaxed ${t.emptyText}`}>
                {timeFilter === 'all' ? '先去投喂一口，功德流水就会从这里开始流动' : '该时间范围内暂无投喂记录'}
              </p>
            </div>
          ) : (
            <>
              <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
              {isCardMode ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {feedings.map((feeding, index) => renderCardItem(feeding, index))}
                </div>
              ) : (
                <div>
                  {feedings.map((feeding, index) => renderListItem(feeding, index))}
                </div>
              )}

              {/* Pagination */}
              {total > PAGE_SIZE && (
                <div className={`mt-5 flex flex-col items-center gap-3 border-t ${t.divider} pt-4 sm:flex-row sm:justify-between`}>
                  <p className={`text-[11px] tracking-wide ${t.statLabel}`}>
                    第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-medium tracking-wide transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${t.toggleInactive}`}
                    >
                      上一页
                    </button>
                    {Array.from({ length: Math.ceil(total / PAGE_SIZE) }, (_, i) => i + 1)
                      .filter((p) => {
                        const totalPages = Math.ceil(total / PAGE_SIZE);
                        if (totalPages <= 5) return true;
                        if (p === 1 || p === totalPages) return true;
                        return Math.abs(p - page) <= 1;
                      })
                      .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, i) =>
                        item === 'ellipsis' ? (
                          <span key={`e${i}`} className={`px-1 text-[11px] ${t.statLabel}`}>…</span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPage(item)}
                            className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-[11px] font-medium tracking-wide transition-colors duration-150 ${
                              page === item ? t.toggleActive : t.toggleInactive
                            }`}
                          >
                            {item}
                          </button>
                        ),
                      )}
                    <button
                      type="button"
                      disabled={page >= Math.ceil(total / PAGE_SIZE)}
                      onClick={() => setPage((p) => p + 1)}
                      className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-medium tracking-wide transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed ${t.toggleInactive}`}
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FishStream;
