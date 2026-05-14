import React, { useState } from 'react';
import { Feeding } from '../services/supabaseService';

type FeedViewMode = 'cards' | 'list';

interface FishStreamProps {
  isNightMode?: boolean;
  feedings: Feeding[];
  isLoading?: boolean;
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

const FishStream: React.FC<FishStreamProps> = ({ isNightMode = false, feedings, isLoading = false }) => {
  const [viewMode, setViewMode] = useState<FeedViewMode>('cards');

  const theme = isNightMode
    ? {
        shell: 'border-cyan-900/24 bg-slate-950/62 text-slate-100 shadow-[0_28px_90px_rgba(2,8,23,0.28)] backdrop-blur-xl',
        inner: 'border-cyan-900/20 bg-slate-950/38',
        muted: 'text-slate-400',
        soft: 'text-slate-300',
        card: 'border-cyan-900/18 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.74))] shadow-[0_18px_42px_rgba(2,8,23,0.2)] backdrop-blur-xl hover:border-cyan-300/36 hover:shadow-[0_24px_60px_rgba(2,8,23,0.28)]',
        cardLatest: 'border-cyan-300/58 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(3,7,18,0.8))] ring-1 ring-cyan-300/18 shadow-[0_22px_56px_rgba(34,211,238,0.12)]',
        latestBadge: 'border-cyan-300/45 bg-cyan-400/14 text-cyan-50 font-medium',
        metaChip: 'border-cyan-900/24 bg-slate-950/60 text-slate-300',
        index: 'border-cyan-900/24 bg-slate-900/82 text-slate-100',
        quote: 'border-cyan-900/22 bg-slate-900/60 text-slate-200',
        rail: 'bg-cyan-300/28',
        railLatest: 'bg-gradient-to-b from-cyan-300 via-emerald-300 to-sky-300',
        emptyShell: 'border-cyan-900/22 bg-slate-950/56 text-slate-100 shadow-[0_24px_70px_rgba(2,8,23,0.22)] backdrop-blur-xl',
        toggleShell: 'border-cyan-900/24 bg-slate-950/55',
        toggleActive: 'bg-cyan-300 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.18)]',
        toggleInactive: 'text-slate-400 hover:text-slate-100',
        sectionBadge: 'border-cyan-900/24 bg-slate-950/60 text-slate-300',
      }
    : {
        shell: 'border-white/70 bg-white/90 text-slate-900 shadow-[0_28px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        inner: 'border-sky-100/80 bg-white/76',
        muted: 'text-slate-500',
        soft: 'text-slate-700',
        card: 'border-slate-200/84 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.84))] shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl hover:border-sky-300/75 hover:shadow-[0_22px_52px_rgba(14,165,233,0.12)]',
        cardLatest: 'border-sky-300/74 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.86))] ring-1 ring-sky-200/70 shadow-[0_18px_42px_rgba(14,165,233,0.14)]',
        latestBadge: 'border-sky-300/80 bg-sky-50 text-sky-700 font-medium',
        metaChip: 'border-slate-200 bg-white/85 text-slate-500',
        index: 'border-slate-200 bg-white text-slate-600',
        quote: 'border-sky-100 bg-gradient-to-br from-white via-sky-50/72 to-emerald-50/44 text-slate-700',
        rail: 'bg-sky-300/65',
        railLatest: 'bg-gradient-to-b from-sky-400 via-cyan-400 to-emerald-300',
        emptyShell: 'border-sky-100 bg-gradient-to-br from-white via-white to-sky-50/60 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        toggleShell: 'border-slate-200 bg-white/80',
        toggleActive: 'bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]',
        toggleInactive: 'text-slate-500 hover:text-slate-900',
        sectionBadge: 'border-slate-200 bg-white/85 text-slate-500',
      };

  const isCardMode = viewMode === 'cards';
  const feedCountLabel = isLoading ? '加载中' : `${feedings.length} 条`;

  const renderFeedItem = (feeding: Feeding, index: number) => {
    const isLatest = index === 0;
    const username = feeding.feederName?.trim() || '匿名喂鱼人';
    const description = feeding.wishDescription || feeding.foodLabel;
    const timeLabel = formatFeedingTime(feeding.created_at);

    if (isCardMode) {
      return (
        <article
          key={feeding.id}
          className={`group relative isolate flex h-full min-h-[17rem] flex-col overflow-hidden rounded-[1.65rem] border transition duration-200 hover:-translate-y-1 ${
            isLatest ? theme.cardLatest : theme.card
          }`}
        >
          <div
            className={`absolute inset-0 ${
              isNightMode
                ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_38%)]'
                : 'bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.07),transparent_38%)]'
            }`}
          />
          <div
            className={`absolute inset-x-0 top-0 h-px ${
              isLatest
                ? isNightMode
                  ? 'bg-gradient-to-r from-transparent via-cyan-300/75 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-sky-400/75 to-transparent'
                : isNightMode
                  ? 'bg-gradient-to-r from-transparent via-cyan-900/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-slate-200/90 to-transparent'
            }`}
          />
          <div className={`absolute inset-y-0 left-0 w-1 ${isLatest ? theme.railLatest : theme.rail}`} />

          <div className="relative flex h-full flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[10px] tracking-[0.28em] uppercase ${theme.muted}`}>投喂者</p>
                <h4 className={`mt-1 break-words font-brand text-[1.35rem] leading-[1.08] tracking-[-0.03em] sm:text-[1.45rem] ${theme.soft}`}>
                  {username}
                </h4>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <span className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.metaChip}`}>
                  {timeLabel}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.latestBadge}`}>
                  {isLatest ? '最新记录' : '投喂记录'}
                </span>
              </div>
            </div>

            <blockquote className={`flex-1 rounded-[1.2rem] border px-4 py-4 ${theme.quote}`}>
              <div className={`text-[10px] tracking-[0.24em] uppercase ${theme.muted}`}>愿望内容</div>
              <p className="mt-2 break-words text-[0.96rem] leading-7 sm:text-[1rem]">“{description}”</p>
            </blockquote>

            <div className="flex items-center justify-end gap-2 pt-0.5">
              <span className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.latestBadge}`}>
                功德 +{feeding.meritEarned}
              </span>
            </div>
          </div>
        </article>
      );
    }

    return (
      <article
        key={feeding.id}
        className={`group relative overflow-hidden rounded-[1.55rem] border transition duration-200 hover:-translate-y-0.5 ${
          isLatest ? theme.cardLatest : theme.card
        }`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-px ${
            isLatest
              ? isNightMode
                ? 'bg-gradient-to-r from-transparent via-cyan-300/75 to-transparent'
                : 'bg-gradient-to-r from-transparent via-sky-400/75 to-transparent'
              : isNightMode
                ? 'bg-gradient-to-r from-transparent via-cyan-900/40 to-transparent'
                : 'bg-gradient-to-r from-transparent via-slate-200/90 to-transparent'
          }`}
        />
        <div className={`absolute inset-y-0 left-0 w-1.5 ${isLatest ? theme.railLatest : theme.rail}`} />

        <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[auto_1fr] lg:gap-5">
          <div className="flex items-start gap-3 lg:flex-col lg:items-start">
            {isLatest ? (
              <span className={`rounded-full border px-2.5 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.latestBadge}`}>
                最新
              </span>
            ) : (
              <span className={`rounded-full border px-2.5 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.metaChip}`}>
                记录
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className={`text-[10px] tracking-[0.28em] uppercase ${theme.muted}`}>用户名</p>
                <h4 className={`mt-1 break-words font-brand text-2xl leading-[1.08] tracking-[-0.03em] ${theme.soft}`}>
                  {username}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <span className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.metaChip}`}>
                  {timeLabel}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[10px] tracking-[0.22em] uppercase ${theme.latestBadge}`}>
                  功德 +{feeding.meritEarned}
                </span>
              </div>
            </div>

            <blockquote className={`mt-4 rounded-[1.35rem] border px-4 py-4 ${theme.quote}`}>
              <p className="break-words text-[0.98rem] leading-8 sm:text-[1.04rem]">“{description}”</p>
            </blockquote>
          </div>
        </div>
      </article>
    );
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className={`rounded-[2rem] border p-5 sm:p-6 ${theme.shell}`}>
          <div className="flex flex-col gap-5 border-b border-current/5 pb-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className={`h-7 w-28 rounded-full ${isNightMode ? 'bg-cyan-900/30' : 'bg-slate-200'}`} />
              <div className={`mt-4 h-10 w-64 rounded-full ${isNightMode ? 'bg-cyan-900/22' : 'bg-slate-100'}`} />
              <div className={`mt-3 h-5 w-full max-w-2xl rounded-full ${isNightMode ? 'bg-cyan-900/18' : 'bg-slate-100'}`} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className={`h-36 rounded-[1.6rem] border ${theme.card} animate-pulse`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (feedings.length === 0) {
    return (
      <div className={`rounded-[2rem] border p-8 text-center sm:p-10 ${theme.emptyShell}`}>
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${theme.inner}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${isNightMode ? 'bg-cyan-300/80' : 'bg-sky-400'}`} />
        </div>
        <p className={`mt-5 font-brand text-2xl ${theme.soft}`}>还没有投喂记录</p>
        <p className={`mt-3 text-sm leading-7 ${theme.muted}`}>先去投喂一口，最新愿望就会出现在这里。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className={`rounded-[2rem] border p-5 sm:p-6 ${theme.shell}`}>
        <div className="flex flex-col gap-5 border-b border-current/5 pb-5 sm:pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-[0.24em] uppercase ${theme.inner}`}>
              <span>最近投喂</span>
              <span aria-hidden="true">·</span>
              <span>{feedCountLabel}</span>
            </div>

            <h3 className="mt-4 font-brand text-3xl tracking-[-0.04em] sm:text-4xl">最近投喂记录</h3>
            <p className={`mt-3 max-w-2xl text-sm leading-7 sm:text-base ${theme.soft}`}>
              按时间倒序展示最近的愿望和功德变化，最新记录会显示在最上面。
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:justify-end">
            <span className={`inline-flex items-center rounded-full border px-3 py-2 text-xs tracking-[0.22em] uppercase ${theme.sectionBadge}`}>
              {isCardMode ? '卡片模式' : '列表模式'}
            </span>
            <div className={`inline-flex items-center rounded-full border p-1 ${theme.toggleShell}`} role="tablist" aria-label="切换投喂展示模式">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-pressed={isCardMode}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[10px] tracking-[0.26em] uppercase transition ${
                  isCardMode ? theme.toggleActive : theme.toggleInactive
                }`}
              >
                卡片
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={!isCardMode}
                className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-[10px] tracking-[0.26em] uppercase transition ${
                  isCardMode ? theme.toggleInactive : theme.toggleActive
                }`}
              >
                列表
              </button>
            </div>
          </div>
        </div>

        <div className={`mt-6 rounded-[1.75rem] border ${theme.inner}`}>
          <div
            className={
              isCardMode
                ? 'grid gap-4 p-4 sm:p-6 lg:grid-cols-3'
                : 'space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5'
            }
          >
            {feedings.map((feeding: Feeding, index: number) => renderFeedItem(feeding, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishStream;
