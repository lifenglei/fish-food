import React, { useEffect, useMemo, useRef, useState } from 'react';
import FishIllustration from './FishIllustration';
import { FOOD_OPTIONS, Feeding, Fish, fishService } from '../services/supabaseService';

interface FishFeedPanelProps {
  isNightMode?: boolean;
  currentMerit: number;
  onSubmitted?: (feeding: Feeding) => void;
  onWishInput?: () => void;
  preferredFishTypeId?: string;
  preferredSpeciesName?: string;
  preferredSpeciesImageUrl?: string;
}

const DEFAULT_FOOD_SLUG = FOOD_OPTIONS.find((option) => option.slug === 'floating-pellet')?.slug || FOOD_OPTIONS[0]?.slug || '';

const FishFeedPanel: React.FC<FishFeedPanelProps> = ({
  isNightMode = false,
  currentMerit,
  onSubmitted,
  onWishInput,
  preferredFishTypeId,
  preferredSpeciesName,
  preferredSpeciesImageUrl,
}) => {
  const [fishCatalog, setFishCatalog] = useState<Fish[]>([]);
  const [isLoadingFish, setIsLoadingFish] = useState(true);
  const [selectedFishId, setSelectedFishId] = useState<string>('');
  const [selectedFoodSlug, setSelectedFoodSlug] = useState(DEFAULT_FOOD_SLUG);
  const [feederName, setFeederName] = useState('');
  const [wishDescription, setWishDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const successTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    fishService.getFishCatalog().then((catalog: Fish[]) => {
      if (!isMounted) {
        return;
      }

      setFishCatalog(catalog);
      setSelectedFishId((currentFishId: string) => currentFishId || catalog[0]?.id || '');
      setIsLoadingFish(false);
    });

    return () => {
      isMounted = false;
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
        successTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (preferredFishTypeId) {
      setSelectedFishId((currentFishId: string) => {
        const preferredFish = fishCatalog.find((fish) => fish.fishTypeId === preferredFishTypeId);
        if (!preferredFish) {
          return currentFishId;
        }

        return currentFishId === preferredFish.id ? currentFishId : preferredFish.id;
      });
    }
  }, [fishCatalog, preferredFishTypeId]);

  const selectedFish = useMemo(
    () => fishCatalog.find((fish) => fish.id === selectedFishId) || fishCatalog[0],
    [fishCatalog, selectedFishId],
  );

  const selectedFood = useMemo(
    () => FOOD_OPTIONS.find((food) => food.slug === selectedFoodSlug) || FOOD_OPTIONS[0],
    [selectedFoodSlug],
  );

  const meritPreview = selectedFood?.merit || 0;
  const selectedFishDisplayName = selectedFish?.name || preferredSpeciesName || '';
  const selectedFishDisplayImageUrl = selectedFish?.fishType?.imageUrl || preferredSpeciesImageUrl;

  const theme = isNightMode
    ? {
        shell: 'border-cyan-900/40 bg-slate-950/80 text-slate-100 shadow-[0_24px_80px_rgba(2,8,23,0.35)]',
        inner: 'border-cyan-900/30 bg-slate-900/55',
        label: 'text-cyan-100',
        muted: 'text-slate-400',
        soft: 'text-slate-300',
        input:
          'border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/90 focus:ring-cyan-400/20',
        choice: 'border-slate-700/80 bg-slate-950/55 hover:border-cyan-400/70 hover:bg-slate-900/90',
        choiceActive:
          'border-cyan-300/80 bg-cyan-400/12 text-slate-50 shadow-[0_16px_40px_rgba(34,211,238,0.18)] ring-2 ring-cyan-300/55 ring-offset-2 ring-offset-slate-950 scale-[1.01]',
        stats: 'border-slate-700/70 bg-slate-950/55',
        disclosure: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-50',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
        error: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
        primary: 'bg-cyan-300 text-slate-950 hover:bg-cyan-200 focus-visible:ring-cyan-200',
        badge: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100',
      }
    : {
        shell: 'border-sky-100 bg-white/92 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)]',
        inner: 'border-sky-100 bg-sky-50/70',
        label: 'text-slate-700',
        muted: 'text-slate-500',
        soft: 'text-slate-700',
        input:
          'border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-sky-500/20',
        choice: 'border-slate-200 bg-white/90 hover:border-sky-300 hover:bg-sky-50',
        choiceActive:
          'border-sky-400 bg-sky-50 text-slate-900 shadow-[0_12px_32px_rgba(14,165,233,0.12)]',
        stats: 'border-slate-200 bg-white/80',
        disclosure: 'border-sky-200 bg-sky-50 text-sky-900',
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        error: 'border-rose-200 bg-rose-50 text-rose-700',
        primary: 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-300',
        badge: 'border-sky-200 bg-sky-50 text-sky-700',
      };

  const clearSuccessMessage = () => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!selectedFish) {
      setError('先选一条鱼，再开始投喂。');
      return;
    }

    if (!selectedFood) {
      setError('先选一种鱼粮。');
      return;
    }

    const trimmedFeederName = feederName.trim();
    const trimmedWishDescription = wishDescription.trim();

    if (!trimmedWishDescription) {
      setError('先写下这次想许的愿望。');
      return;
    }

    setIsSubmitting(true);
    setError('');
    clearSuccessMessage();
    setSuccessMessage('');

    try {
      const result = await fishService.addFeeding({
        fishId: selectedFish.id,
        foodSlug: selectedFood.slug,
        wishDescription: trimmedWishDescription,
        feederName: trimmedFeederName || undefined,
      });

      if (!result) {
        setError('投喂失败，鱼塘暂时没接住这口鱼粮。');
        return;
      }

      const submittedMerit = result.meritEarned;
      const submittedTotalMerit = currentMerit + submittedMerit;
      const submittedFishName = selectedFish.name;
      const submittedFoodLabel = result.foodLabel || selectedFood.label;
      const submittedWishDescription = result.wishDescription || trimmedWishDescription;

      setSuccessMessage(
        `已投喂成功，${submittedFishName} 收下了 ${submittedFoodLabel}，愿望“${submittedWishDescription}”已记录，功德 +${submittedMerit}，你当前累计 ${submittedTotalMerit}。`,
      );
      onSubmitted?.(result);
      setFeederName('');
      setWishDescription('');
      setSelectedFoodSlug(DEFAULT_FOOD_SLUG);

      successTimerRef.current = window.setTimeout(() => {
        setSuccessMessage('');
        successTimerRef.current = null;
      }, 2800);
    } catch (submitError) {
      console.error('Error submitting feeding:', submitError);
      setError('投喂失败，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-5xl">
      <div
        className={`absolute -inset-1 rounded-[2rem] bg-gradient-to-r opacity-30 blur-xl ${
          isNightMode ? 'from-cyan-500/30 via-emerald-400/20 to-sky-500/30' : 'from-sky-300/60 via-white to-emerald-300/60'
        }`}
      />

      <div className={`relative rounded-[2rem] border backdrop-blur-xl ${theme.shell}`}>
        <div className="border-b border-white/5 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className={`text-xs tracking-[0.34em] uppercase ${theme.muted}`}>投喂面板</p>
              <h2 className="mt-3 font-brand text-3xl tracking-[-0.03em] sm:text-4xl">给鱼来一口，功德多一点</h2>
              <p className={`mt-4 max-w-2xl text-sm leading-7 sm:text-base ${theme.soft}`}>
                先选鱼，再选鱼粮，投喂成功后会实时记录到流水里。{preferredSpeciesName ? `当前推荐：${preferredSpeciesName}。` : ''}本站全部收益将用于公益事业。
              </p>
            </div>

            <div className={`rounded-full border px-4 py-2 text-xs tracking-[0.24em] uppercase ${theme.badge}`}>
              {preferredSpeciesName ? `默认推荐：${preferredSpeciesName}` : '本站全部收益将用于公益事业'}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {successMessage && (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm leading-7 ${theme.success}`} role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          {error && (
            <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm leading-7 ${theme.error}`} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" aria-busy={isSubmitting}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`rounded-2xl border px-4 py-4 ${theme.stats}`}>
                <p className={`text-[10px] tracking-[0.24em] uppercase ${theme.muted}`}>当前累计功德</p>
                <p className={`mt-2 font-brand text-3xl tracking-[-0.03em] ${theme.soft}`}>{currentMerit}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${theme.stats}`}>
                <p className={`text-[10px] tracking-[0.24em] uppercase ${theme.muted}`}>本次投喂功德</p>
                <p className={`mt-2 font-brand text-3xl tracking-[-0.03em] ${theme.soft}`}>+{meritPreview}</p>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${theme.stats}`}>
                <p className={`text-[10px] tracking-[0.24em] uppercase ${theme.muted}`}>收益去向</p>
                <p className={`mt-2 font-brand text-3xl tracking-[-0.03em] ${theme.soft}`}>公益</p>
              </div>
            </div>

            <div className={`rounded-2xl border px-4 py-4 ${theme.disclosure}`} role="note">
              本站全部收益将用于公益事业。页面相关收入会优先投入公益项目，请以站内公示为准。
            </div>

            <fieldset className="space-y-3">
              <legend className={`text-sm font-medium ${theme.label}`}>选择一条鱼</legend>
              {isLoadingFish ? (
                <div className={`rounded-2xl border px-4 py-5 text-sm leading-7 ${theme.inner} ${theme.soft}`}>
                  鱼塘正在装水，鱼群列表马上就来。
                </div>
              ) : fishCatalog.length === 0 ? (
                <div className={`rounded-2xl border px-4 py-5 text-sm leading-7 ${theme.inner} ${theme.soft}`}>
                  暂时还没有鱼入驻，先把鱼群种子数据补进来。
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {fishCatalog.map((fish) => {
                    const isSelected = fish.id === selectedFishId;
                    const favoriteFood = FOOD_OPTIONS.find((option) => option.slug === fish.favoriteFoodSlug);
                    const gradient = fish.fishType
                      ? `linear-gradient(135deg, ${fish.fishType.accentFrom}, ${fish.fishType.accentTo})`
                      : 'linear-gradient(135deg, #0ea5e9, #10b981)';

                    return (
                      <label
                        key={fish.id}
                        className={`group relative block cursor-pointer overflow-hidden rounded-2xl border p-4 transition duration-200 ${isSelected ? theme.choiceActive : theme.choice}`}
                      >
                        <input
                          type="radio"
                          name="fish"
                          value={fish.id}
                          checked={isSelected}
                          onChange={() => {
                            setSelectedFishId(fish.id);
                            if (error) {
                              setError('');
                            }
                          }}
                          className="sr-only"
                        />
                        <div className="relative grid gap-4 transition duration-200 md:grid-cols-[0.92fr_1.08fr] md:items-center">
                          <div className="relative overflow-hidden rounded-[1.35rem] border border-white/5 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                            {fish.fishType?.imageUrl ? (
                              <img
                                src={fish.fishType.imageUrl}
                                alt=""
                                className="aspect-[16/10] w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <FishIllustration
                                accentFrom={fish.fishType?.accentFrom || '#0ea5e9'}
                                accentTo={fish.fishType?.accentTo || '#10b981'}
                                variant={fish.displayOrder}
                                isNightMode={isNightMode}
                                className="aspect-[16/10] w-full"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/58 via-slate-950/12 to-transparent transition duration-200 group-hover:opacity-90 group-focus-within:opacity-90" />
                          </div>

                          <div className="min-w-0">
                            <span className="mb-3 block h-2 w-24 rounded-full" style={{ backgroundImage: gradient }} />
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-brand text-2xl tracking-[-0.03em]">{fish.name}</p>
                              <span className={`rounded-full border px-2 py-1 text-[10px] tracking-[0.18em] uppercase ${theme.badge}`}>
                                {fish.fishType?.name || '鱼种'}
                              </span>
                            </div>
                            <p className={`mt-2 text-sm leading-7 ${theme.soft}`}>{fish.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs leading-6">
                              <span className={`rounded-full border px-3 py-1 ${theme.badge}`}>最爱鱼粮：{favoriteFood?.label || '普通鱼粮'}</span>
                              <span className={`rounded-full border px-3 py-1 ${theme.badge}`}>水里很活跃</span>
                            </div>
                          </div>
                        </div>

                        <div className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-4 opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none group-hover:opacity-100 group-focus-within:opacity-100 ${
                          isNightMode ? 'bg-[rgb(0_0_0_/_0.4)] backdrop-blur-[8px]' : 'bg-[rgb(0_0_0_/_0.4)] backdrop-blur-[8px]'
                        }`}>
                          <div
                            className={`w-full max-w-[19rem] rounded-[1.75rem] border px-5 py-6 text-center shadow-[0_24px_56px_rgba(15,23,42,0.18)] backdrop-blur-md ${
                              isNightMode ? 'border-white/18 bg-slate-700/66' : 'border-white/24 bg-slate-500/66'
                            }`}
                          >
                            <div
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] tracking-[0.24em] uppercase ${
                                isNightMode ? 'border-white/18 bg-white/10 text-white' : 'border-white/30 bg-white/16 text-white'
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                              鱼的寓意
                            </div>
                            <p className="mt-4 text-sm font-semibold leading-8 text-white sm:text-[1.02rem]">
                              {fish.fishType?.moral || '这条鱼的寓意稍后补充'}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>

            {selectedFish && (
              <div className={`rounded-2xl border px-4 py-4 ${theme.inner}`}>
                <p className={`text-[10px] tracking-[0.24em] uppercase ${theme.muted}`}>当前选中鱼</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="overflow-hidden rounded-[1.2rem] border border-white/5 shadow-[0_16px_36px_rgba(15,23,42,0.08)]">
                    {selectedFishDisplayImageUrl ? (
                      <img
                        src={selectedFishDisplayImageUrl}
                        alt=""
                        className="aspect-[4/3] w-24 object-cover sm:w-28"
                        loading="lazy"
                      />
                    ) : (
                      <FishIllustration
                        accentFrom={selectedFish.fishType?.accentFrom || '#0ea5e9'}
                        accentTo={selectedFish.fishType?.accentTo || '#10b981'}
                        variant={selectedFish.displayOrder}
                        isNightMode={isNightMode}
                        className="aspect-[4/3] w-24 sm:w-28"
                      />
                    )}
                  </div>
                  <p className={`font-brand text-2xl tracking-[-0.03em] ${theme.soft}`}>{selectedFishDisplayName}</p>
                </div>
              </div>
            )}

            <fieldset className="space-y-3">
              <legend className={`text-sm font-medium ${theme.label}`}>选择鱼粮</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {FOOD_OPTIONS.map((food) => {
                  const isSelected = food.slug === selectedFoodSlug;

                  return (
                    <label
                      key={food.slug}
                      className={`relative block cursor-pointer rounded-2xl border p-4 transition duration-200 ${isSelected ? theme.choiceActive : theme.choice}`}
                    >
                      <input
                        type="radio"
                        name="food"
                        value={food.slug}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedFoodSlug(food.slug);
                          if (error) {
                            setError('');
                          }
                        }}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-brand text-xl tracking-[-0.03em]">{food.label}</p>
                          <p className={`mt-2 text-sm leading-7 ${theme.soft}`}>{food.description}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-[10px] tracking-[0.22em] uppercase ${theme.muted}`}>功德</p>
                          <p className="mt-1 font-brand text-2xl tracking-[-0.03em]">+{food.merit}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${theme.label}`} htmlFor="wish-description">
                  投喂愿望（必填）
                </label>
                <textarea
                  id="wish-description"
                  value={wishDescription}
                  onChange={(event) => {
                    setWishDescription(event.target.value);
                    onWishInput?.();
                    if (error) {
                      setError('');
                    }
                  }}
                  placeholder="例如：愿鱼塘平安，大家都能收获一点好心情"
                  className={`min-h-28 w-full rounded-2xl border px-4 py-3 text-left text-base leading-7 transition duration-200 outline-none focus:ring-2 ${theme.input}`}
                  autoComplete="off"
                  maxLength={120}
                  rows={4}
                  required
                />
                <p className={`text-xs leading-6 ${theme.muted}`}>这段愿望会随本次投喂一起记录到最近投喂流水中。</p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr] md:items-start">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${theme.label}`} htmlFor="feeder-name">
                    投喂署名（可选）
                  </label>
                  <input
                    id="feeder-name"
                    type="text"
                    value={feederName}
                    onChange={(event) => {
                      setFeederName(event.target.value);
                      if (error) {
                        setError('');
                      }
                    }}
                    placeholder="例如：认真喂鱼的人"
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-base leading-7 transition duration-200 outline-none focus:ring-2 ${theme.input}`}
                    autoComplete="nickname"
                    maxLength={32}
                  />
                  <p className={`text-xs leading-6 ${theme.muted}`}>不留名也可以，系统仍会正常记录本次投喂。</p>
                </div>

                <div className={`rounded-2xl border px-4 py-4 ${theme.inner}`}>
                  <p className={`text-[10px] tracking-[0.24em] uppercase ${theme.muted}`}>本次功德</p>
                  <p className={`mt-2 font-brand text-3xl tracking-[-0.03em] ${theme.soft}`}>+{meritPreview}</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoadingFish || !selectedFish || !selectedFood || !wishDescription.trim()}
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-full border px-6 text-sm font-medium tracking-[0.18em] uppercase transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme.primary}`}
            >
              {isSubmitting ? '投喂中…' : '立即投喂'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FishFeedPanel;
