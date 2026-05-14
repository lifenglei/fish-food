import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Feeding, FishSpecies, fishService } from './services/supabaseService';
import AmbientBackground from './components/AmbientBackground';
import FishFeedPanel from './components/WishWall';
import FishStream from './components/WishScroll';

const fishHighlights = [
  {
    title: '鱼群类型',
    body: '金鱼、锦鲤、蓝吊等鱼群统一展示，方便你按喜好挑着喂。',
  },
  {
    title: '鱼粮选择',
    body: '藻饼、浮水粒、虾干、丰年虾，喂得越认真，功德越高。',
  },
  {
    title: '公益透明',
    body: '本站全部收益将用于公益事业，核心承诺会放在每个关键入口。',
  },
];

const siteBackgroundImage = new URL('./assets/bg.png', import.meta.url).href;
const siteBackgroundVideo = new URL('./assets/fish.mp4', import.meta.url).href;

const App: React.FC = () => {
  const [isNightMode, setIsNightMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isLoadingFeedings, setIsLoadingFeedings] = useState(true);
  const [fishSpecies, setFishSpecies] = useState<FishSpecies[]>([]);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(true);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    fishService.getFishSpecies().then((species) => {
      if (!isMounted) {
        return;
      }

      setFishSpecies(species);
      setIsLoadingSpecies(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (fishSpecies.length === 0) {
      return;
    }

    setSelectedSpeciesId((currentSpeciesId: string) => {
      if (currentSpeciesId && fishSpecies.some((species) => species.id === currentSpeciesId)) {
        return currentSpeciesId;
      }

      return fishSpecies[0]?.id || '';
    });
  }, [fishSpecies]);

  const orderedFishSpecies = useMemo(
    () => [...fishSpecies].sort((left, right) => left.displayOrder - right.displayOrder),
    [fishSpecies],
  );
  const fishSpeciesCountLabel = isLoadingSpecies ? '加载中' : `${orderedFishSpecies.length} 种`;
  const selectedSpecies = orderedFishSpecies.find((species) => species.id === selectedSpeciesId) || orderedFishSpecies[0];
  const publicMerit = useMemo(() => feedings.reduce((total, feeding) => total + feeding.meritEarned, 0), [feedings]);

  useEffect(() => {
    let isMounted = true;

    fishService.getRecentFeedings().then((recentFeedings) => {
      if (!isMounted) {
        return;
      }

      setFeedings(recentFeedings);
      setIsLoadingFeedings(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showNotice = (message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    setShowToast(true);
    toastTimerRef.current = window.setTimeout(() => {
      setShowToast(false);
      toastTimerRef.current = null;
    }, 2600);
  };

  const handleFeedSubmitted = (feeding: Feeding) => {
    setFeedings((previous: Feeding[]) => [feeding, ...previous.filter((item: Feeding) => item.id !== feeding.id)].slice(0, 40));
    showNotice(`功德 +${feeding.meritEarned}，鱼群已经收到这次投喂`);
  };

  const handleShare = async () => {
    const shareData = {
      title: '在线喂鱼公益站',
      text: '来在线喂鱼，给鱼粮也给公益加一点功德。本站全部收益将用于公益事业。',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      showNotice('公益站链接已复制');
    } catch (error) {
      console.error('Error sharing:', error);
      showNotice('分享失败，请手动复制链接');
    }
  };

  const pageClasses = isNightMode ? 'bg-slate-950 text-slate-50' : 'bg-sky-50 text-slate-900';

  const panelClasses = isNightMode
    ? 'border-cyan-900/40 bg-slate-950/58 text-slate-100 shadow-[0_24px_80px_rgba(2,8,23,0.32)] backdrop-blur-xl'
    : 'border-white/60 bg-white/58 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl';

  const mutedTextClasses = isNightMode ? 'text-slate-400' : 'text-slate-600';
  const softTextClasses = isNightMode ? 'text-slate-300' : 'text-slate-700';

  const primaryButtonClasses = isNightMode
    ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:ring-cyan-200'
    : 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300';

  const secondaryButtonClasses = isNightMode
    ? 'border-cyan-900/40 bg-slate-900/70 text-slate-100 hover:border-cyan-400/70 hover:bg-slate-800/80 focus-visible:ring-cyan-400/30'
    : 'border-slate-300 bg-white/80 text-slate-800 hover:border-sky-300 hover:bg-white focus-visible:ring-sky-300';

  const utilityButtonClasses = isNightMode
    ? 'border-cyan-900/40 bg-slate-900/80 text-slate-100 hover:border-cyan-400/70 hover:bg-slate-800/90 focus-visible:ring-cyan-400/30'
    : 'border-slate-300 bg-white/85 text-slate-800 hover:border-sky-300 hover:bg-white focus-visible:ring-sky-300';


  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-700 ${pageClasses}`}
      style={{
        backgroundImage: isNightMode
          ? 'linear-gradient(180deg, rgba(2,6,23,0.08), rgba(2,6,23,0.24))'
          : 'linear-gradient(180deg, rgba(240,249,255,0.82), rgba(236,253,245,0.82))',
      }}
    >
      <a
        href="#main-content"
        className={`sr-only z-50 rounded-full border px-4 py-2 text-sm font-medium transition focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 ${utilityButtonClasses}`}
      >
        跳到主要内容
      </a>

      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
            isNightMode ? 'opacity-92' : 'opacity-100'
          }`}
          style={{ backgroundImage: `url(${siteBackgroundImage})` }}
        />
        <video
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 mix-blend-screen ${
            isNightMode ? 'opacity-12' : 'opacity-18'
          }`}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          src={siteBackgroundVideo}
        />
        <div className={`absolute inset-0 transition-colors duration-700 ${isNightMode ? 'bg-slate-950/28' : 'bg-white/16'}`} />
        <div
          className={`absolute inset-0 bg-gradient-to-b transition-opacity duration-700 ${
            isNightMode ? 'from-slate-950/10 via-transparent to-slate-950/30' : 'from-white/12 via-transparent to-white/22'
          }`}
        />
      </div>

      <AmbientBackground isNightMode={isNightMode} />

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6">
        <button
          type="button"
          onClick={handleShare}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${utilityButtonClasses}`}
          title="分享公益鱼塘"
          aria-label="分享公益鱼塘"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* <button
          type="button"
          onClick={() => setIsNightMode((previous: boolean) => !previous)}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${utilityButtonClasses}`}
          title={isNightMode ? '切换到白昼' : '切换到暮色'}
          aria-label={isNightMode ? '切换到白昼' : '切换到暮色'}
          aria-pressed={isNightMode}
        >
          {isNightMode ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button> */}
      </div>

      <div
        className={`fixed right-4 top-20 z-50 rounded-full border px-4 py-2 text-sm backdrop-blur-md transition-all duration-300 sm:right-6 ${
          showToast ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none'
        } ${isNightMode ? 'border-cyan-900/40 bg-slate-900/90 text-slate-100' : 'border-slate-300 bg-white/90 text-slate-800'}`}
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>

      <main id="main-content" className="relative z-10">
        <header className="mx-auto max-w-6xl px-4 pb-10 pt-20 sm:pt-24 lg:pt-28">
          <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-[11px] tracking-[0.32em] uppercase ${panelClasses}`}>
            <span>Fish Feeding公益站</span>
            <span aria-hidden="true">·</span>
            <span>在线喂鱼</span>
            <span aria-hidden="true">·</span>
            <span>{fishSpeciesCountLabel}</span>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl font-brand text-5xl leading-[0.94] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-8xl">
                在线喂鱼
                <br />
                攒功德
              </h1>

              <p className={`mt-6 max-w-2xl text-base leading-8 sm:text-lg ${softTextClasses}`}>
                这里展示鱼的类型和鱼群列表，也让你选择鱼粮给鱼投喂。每一次投喂都会记录成流水，功德会跟着增加。本站全部收益将用于公益事业。
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#feed"
                  className={`inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium transition duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${primaryButtonClasses}`}
                >
                  立即投喂
                </a>
                <a
                  href="#fish-stream"
                  className={`inline-flex min-h-11 items-center justify-center rounded-full border px-6 text-sm font-medium transition duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${secondaryButtonClasses}`}
                >
                  查看鱼群
                </a>
              </div>

              <div className={`mt-6 inline-flex rounded-full border px-4 py-2 text-xs tracking-[0.28em] uppercase ${panelClasses}`}>
                当前累计功德 +{publicMerit}
              </div>

              <p className={`mt-4 max-w-2xl text-sm leading-7 ${mutedTextClasses}`}>
                选鱼、选粮、投喂、看流水，整个过程都围绕公益透明展开。
              </p>
            </div>

            <div className={`rounded-[2rem] border p-5 sm:p-6 ${panelClasses}`}>
              <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>鱼塘亮点</p>
              <div className="mt-5 grid gap-4">
                {fishHighlights.map((highlight, index) => (
                  <div
                    key={highlight.title}
                    className={`rounded-2xl border px-4 py-4 ${isNightMode ? 'border-cyan-900/30 bg-slate-950/35' : 'border-slate-200 bg-sky-50/80'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-brand tracking-[0.28em] ${mutedTextClasses}`}>
                        0{index + 1}
                      </span>
                      <span className={`h-px flex-1 ${isNightMode ? 'bg-cyan-900/40' : 'bg-slate-200'}`} />
                    </div>
                    <h2 className="mt-3 font-brand text-lg">{highlight.title}</h2>
                    <p className={`mt-2 text-sm leading-7 ${mutedTextClasses}`}>{highlight.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* <section className="mx-auto max-w-6xl px-4 py-6">
          <div className={`grid gap-4 rounded-[2rem] border p-5 sm:grid-cols-3 sm:p-6 ${panelClasses}`}>
            <div>
              <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>投喂原则</p>
              <p className={`mt-2 text-sm leading-7 ${softTextClasses}`}>先选鱼，再选鱼粮，最后确认投喂。每次成功都会有明确反馈。</p>
            </div>
            <div>
              <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>功德累计</p>
              <p className="mt-2 font-brand text-3xl tracking-[-0.03em]">+{publicMerit}</p>
            </div>
            <div>
              <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>公益声明</p>
              <p className={`mt-2 text-sm leading-7 ${softTextClasses}`}>本站全部收益将用于公益事业，并会在关键入口持续提示。</p>
            </div>
          </div>
        </section> */}

        <section id="feed" className="mx-auto max-w-6xl px-4 py-8 scroll-mt-24 md:py-12">
          <div className={`mb-8 rounded-[2rem] border p-5 sm:p-6 ${panelClasses}`}>
            <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>投喂面板</p>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-brand text-3xl md:text-4xl">选择鱼和鱼粮</h2>
                <p className={`mt-3 max-w-3xl text-sm leading-7 md:text-base ${softTextClasses}`}>
                  这里可以挑鱼、挑食物、写个署名，然后把功德收进自己的账本里。本站全部收益将用于公益事业。
                </p>
              </div>
              <a
                href="#fish-stream"
                className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${secondaryButtonClasses}`}
              >
                查看投喂流水
              </a>
            </div>
          </div>

          <FishFeedPanel
            isNightMode={isNightMode}
            currentMerit={publicMerit}
            onSubmitted={handleFeedSubmitted}
            preferredFishTypeId={selectedSpecies?.id}
            preferredSpeciesName={selectedSpecies?.name}
            preferredSpeciesImageUrl={selectedSpecies?.imageUrl}
          />
        </section>

        <section id="fish-stream" className="mx-auto max-w-6xl px-4 py-10 scroll-mt-24 md:py-16">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>最近投喂</p>
              <h2 className="mt-3 font-brand text-3xl md:text-4xl">最近投喂记录</h2>
              <p className={`mt-3 max-w-3xl text-sm leading-7 md:text-base ${softTextClasses}`}>
                最新一条会优先置顶，方便快速扫读最近的愿望、署名和功德变化。
              </p>
            </div>
            <a
              href="#feed"
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${secondaryButtonClasses}`}
            >
              继续投喂
            </a>
          </div>

          <FishStream isNightMode={isNightMode} feedings={feedings} isLoading={isLoadingFeedings} />
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className={`rounded-[2rem] border p-6 sm:p-8 ${panelClasses}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>公益说明</p>
                <p className="mt-2 font-brand text-2xl">本站全部收益将用于公益事业</p>
              </div>
              <p className={`max-w-2xl text-sm leading-7 ${softTextClasses}`}>
                我们会把鱼群展示、投喂记录和功德累计做成清晰可见的页面信息，方便用户在参与前后都能看见承诺。
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={`relative z-10 border-t ${isNightMode ? 'border-cyan-900/40' : 'border-slate-200'}`}>
        <div className="mx-auto max-w-6xl px-4 py-10 text-center">
          <div className={`text-xs tracking-[0.32em] uppercase ${mutedTextClasses}`}>在线喂鱼公益站</div>
          <div className={`mt-2 text-[11px] tracking-[0.24em] ${mutedTextClasses}`}>
            © {new Date().getFullYear()} · 鱼群公开展示，投喂公开记录，收益用于公益事业
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
