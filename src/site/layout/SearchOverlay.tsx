import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, Search, TrendingUp, X } from 'lucide-react';
import { Img } from '@/components/ui/misc';
import { Price } from '@/site/components/Price';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCategories } from '@/store/hooks';
import { searchProducts } from '@/lib/search';
import type { Lang } from '@/lib/types';
import { chrome } from './dict';

/** Popular searches per language — every term matches products in the catalogue. */
const POPULAR: Record<Lang, string[]> = {
  sq: ['gota 400', 'kapak kupolë', 'mikrovalë', 'sushi', 'salca', 'tortë', 'shkop'],
  en: ['cup 400', 'dome lid', 'microwave', 'sushi', 'sauce cup', 'cake box', 'straw'],
  me: ['čaša 400', 'poklopac', 'mikrotalasnu', 'suši', 'sos', 'kutija', 'slamka'],
};

export function SearchOverlay() {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);
  const t = useDict(site);
  const c = useDict(chrome);
  const l = useL();
  const lang = useLang();
  const products = useActiveProducts();
  const cats = useCategories();
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => input.current?.focus(), 60);
      const fn = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', fn);
      return () => window.removeEventListener('keydown', fn);
    }
  }, [open, setOpen]);

  const results = useMemo(() => searchProducts(products, cats, q, lang), [products, cats, q, lang]);
  const bestsellers = useMemo(() => [...products].filter((p) => !p.quoteOnly).sort((a, b) => b.sold - a.sold).slice(0, 4), [products]);
  const close = () => setOpen(false);
  const submit = () => {
    if (!q.trim()) return;
    close();
    navigate(`/kerko?q=${encodeURIComponent(q.trim())}`);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85]">
          <motion.div className="absolute inset-0 bg-ink/45 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t('searchPlaceholder')}
            className="relative max-h-[90vh] overflow-y-auto rounded-b-[28px] bg-paper shadow-2xl"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
          >
            <div className="container-x py-5 sm:py-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex items-center gap-3 rounded-full bg-white p-2 pl-5 shadow-[0_18px_40px_-28px_rgba(15,29,22,0.55)] ring-1 ring-line focus-within:ring-2 focus-within:ring-brand-600 sm:pl-6"
              >
                <Search className="h-5 w-5 shrink-0 text-brand-700 sm:h-6 sm:w-6" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  enterKeyHint="search"
                  className="h-11 min-w-0 flex-1 bg-transparent font-display text-[19px] font-semibold tracking-tight text-ink outline-none placeholder:font-medium placeholder:text-muted/70 sm:h-14 sm:text-3xl"
                />
                <button type="button" onClick={close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand text-ink transition-colors hover:bg-ink hover:text-paper sm:h-12 sm:w-12" aria-label={c('closeSearch')}>
                  <X className="h-5 w-5" />
                </button>
              </form>

              {!q.trim() ? (
                <div className="grid gap-8 pb-2 pt-7 lg:grid-cols-[1fr_1.6fr] lg:gap-12">
                  <div>
                    <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('popularSearches')}</div>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR[lang].map((p) => (
                        <button key={p} onClick={() => setQ(p)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[13.5px] font-semibold text-ink-soft transition-colors hover:border-ink/30 hover:text-ink">
                          <TrendingUp className="h-3.5 w-3.5 text-brand-600" /> {p}
                        </button>
                      ))}
                    </div>
                    <div className="mb-3 mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t('categories')}</div>
                    <div className="flex flex-wrap gap-2">
                      {cats.map((cat) => (
                        <Link key={cat.id} to={`/produktet/${cat.slug}`} onClick={close} className="group inline-flex h-10 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3.5 text-[13px] font-semibold text-ink ring-1 ring-line transition-colors hover:ring-ink/30">
                          <span className="h-8 w-8 overflow-hidden rounded-full bg-sand">
                            <Img src={cat.image} small alt="" className="h-full w-full object-cover" />
                          </span>
                          {l(cat.name)}
                          {cat.soon && <span className="rounded-full bg-pink-soft px-1.5 py-px text-[9.5px] font-bold uppercase text-pink-ink">{c('soon')}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{c('quickLinks')}</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {bestsellers.map((p) => (
                        <Link key={p.id} to={`/produkt/${p.slug}`} onClick={close} className="group flex flex-col rounded-2xl bg-white p-2 ring-1 ring-line transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(15,29,22,0.55)]">
                          <span className="aspect-square overflow-hidden rounded-xl bg-sand">
                            <Img src={p.images[0]} small alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          </span>
                          <span className="mt-2.5 line-clamp-2 px-1 text-[13px] font-semibold leading-snug text-ink">{l(p.name)}</span>
                          <Price product={p} size="sm" showPiece className="mt-1 px-1" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="py-14 text-center">
                  <p className="font-display text-xl font-bold text-ink">{t('noResults', { q })}</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {POPULAR[lang].slice(0, 4).map((p) => (
                      <button key={p} onClick={() => setQ(p)} className="h-9 rounded-full border border-line bg-white px-3.5 text-[13.5px] font-semibold text-ink-soft hover:border-ink/30 hover:text-ink">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pb-2 pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-muted">{t('results', { n: results.length })}</span>
                    <button onClick={submit} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink hover:text-brand-700">
                      {t('seeAll')} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {results.slice(0, 9).map((p) => (
                      <Link key={p.id} to={`/produkt/${p.slug}`} onClick={close} className="group flex items-center gap-4 rounded-2xl bg-white/0 p-2.5 ring-1 ring-transparent transition-colors hover:bg-white hover:ring-line">
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                          <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink">{l(p.name)}</span>
                          <Price product={p} size="sm" className="mt-0.5" />
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink/25 transition-colors group-hover:text-brand-700" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
