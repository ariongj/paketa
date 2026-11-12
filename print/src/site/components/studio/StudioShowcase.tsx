import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Rotate3d } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Img } from '@/components/ui/misc';
import { useDict, useLang } from '@/i18n';
import { cn } from '@/lib/utils';
import { href } from '@/lib/paths';
import { ChevronTexture } from '@/site/components/company/Print';
import { SD, STUDIO_PATH, studioApi } from './model';

/** Examples offered under the live bag: ids of studio examples (SAMPLES in src/studio/studio.js) and their two colours. */
const PICKS = [
  { id: 'premium', sq: 'Premium', en: 'Premium', a: '#f6f5f2', b: '#80298f' },
  { id: 'butik', sq: 'Folje ari', en: 'Gold foil', a: '#17171a', b: '#d6b25a' },
  { id: 'kafe', sq: 'Kraft', en: 'Kraft', a: '#b98b5d', b: '#17171a' },
  { id: 'luksoze', sq: 'Me motiv', en: 'Patterned', a: '#f6f5f2', b: '#80298f' },
  { id: 'ngjyre', sq: 'Ngjyrë e plotë', en: 'Full colour', a: '#e772c4', b: '#17171a' },
];
const STAGE = 'ecebef';

/**
 * Homepage showcase for the 3D studio, right under the hero: a real, turning 3D bag (the studio page in its
 * "embed" mode) with ready-made examples to switch between. three.js is only fetched when the section is about
 * to scroll into view, drawing stops while it is off screen, and a still picture stands in until the model is ready.
 */
export function StudioShowcase() {
  const t = useDict(SD);
  const lang = useLang();
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const visible = useRef(false);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [pick, setPick] = useState(PICKS[0].id);
  const [src] = useState(() => href(`/studio.html?embed=1&bg=${STAGE}&sample=${PICKS[0].id}&lang=${lang}`));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      visible.current = true;
      setLive(true);
      return;
    }
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setLive(true);
        near.disconnect();
      },
      { rootMargin: '250px 0px' },
    );
    const seen = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      studioApi(frame.current)?.setActive(e.isIntersecting);
    });
    near.observe(el);
    seen.observe(el);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const d = e.data as { source?: string; type?: string } | null;
      if (d?.source !== 'pw-studio' || d.type !== 'ready') return;
      studioApi(frame.current)?.setActive(visible.current);
      setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (ready) studioApi(frame.current)?.setLang(lang);
  }, [lang, ready]);

  const choose = (id: string) => {
    setPick(id);
    studioApi(frame.current)?.loadSample(id);
  };

  return (
    <section className="bg-paper py-14 sm:py-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[28px] bg-ink text-white sm:rounded-[40px]">
          <ChevronTexture />
          <div className="pointer-events-none absolute -left-40 -top-40 h-[460px] w-[460px] rounded-full bg-brand-600/35 blur-[130px]" />
          <div className="relative grid gap-6 p-4 sm:p-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8 lg:p-8 xl:gap-12 xl:p-10">
            <div className="flex flex-col justify-center px-2 pb-2 pt-5 sm:px-4 lg:py-10 xl:pl-6">
              <div className="mono flex items-center gap-2 text-[11.5px] uppercase tracking-[0.18em] text-brand-300">
                <Rotate3d className="h-4 w-4" /> {t('bandEyebrow')}
              </div>
              <h2 className="display mt-4 text-[36px] leading-[1.02] text-white sm:text-[50px] xl:text-[56px]">{t('showTitle')}</h2>
              <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-white/70">{t('showText')}</p>
              <ul className="mt-6 space-y-2.5 text-[14.5px] text-white/85">
                {(['showB1', 'showB2', 'showB3'] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600/40 text-brand-200">
                      <Check className="h-3 w-3" />
                    </span>
                    {t(k)}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <ButtonLink to={`${STUDIO_PATH}?sample=${pick}`} size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
                  {t('bandCta')}
                </ButtonLink>
                <ButtonLink to="/produktet/qese-letre" size="lg" variant="outlineLight">
                  {t('showSecond')}
                </ButtonLink>
              </div>
            </div>

            <div ref={box} className="relative h-[440px] overflow-hidden rounded-[22px] bg-[#ecebef] sm:h-[520px] sm:rounded-[28px] lg:h-auto lg:min-h-[600px]">
              <Img
                src="/images/studio/studio-bags.webp"
                alt={t('bandAlt')}
                className={cn('absolute inset-0 h-full w-full object-contain p-6 !duration-500', ready && '!opacity-0')}
              />
              {live && (
                <iframe
                  ref={frame}
                  src={src}
                  title={t('frameTitle')}
                  tabIndex={-1}
                  className={cn('absolute inset-0 h-full w-full border-0 transition-opacity duration-700 [@media(pointer:coarse)]:pointer-events-none', ready ? 'opacity-100' : 'opacity-0')}
                />
              )}
              <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 font-mono text-[11px] text-ink-soft ring-1 ring-line backdrop-blur sm:left-4 sm:top-4">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> {t('showLive')}
              </span>
              <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="radiogroup" aria-label={t('showPick')}>
                  {PICKS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={p.id === pick}
                      onClick={() => choose(p.id)}
                      className={cn(
                        'inline-flex h-9 shrink-0 items-center gap-2 rounded-full pl-2 pr-3.5 text-[12.5px] font-semibold ring-1 backdrop-blur transition-colors',
                        p.id === pick ? 'bg-ink text-white ring-ink' : 'bg-white/90 text-ink ring-line hover:bg-white',
                      )}
                    >
                      <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${p.a} 58%, ${p.b} 58%)` }} />
                      {p[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
