import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, FileText, Search, X } from 'lucide-react';
import { Img } from '@/components/ui/misc';
import { Price } from '@/site/components/Price';
import { useDict, useL, useLang } from '@/i18n';
import { site } from '@/i18n/site';
import { useUi } from '@/store/ui';
import { useActiveProducts, useCategories } from '@/store/hooks';
import { searchProducts } from '@/lib/search';
import { POPULAR_SEARCHES } from '@/site/components/utility/shared';
import { CmykBar } from '@/site/components/company/Print';

export function SearchOverlay() {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);
  const t = useDict(site);
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
  const popular = useMemo(() => POPULAR_SEARCHES[lang].filter((term) => searchProducts(products, cats, term, lang).length > 0), [products, cats, lang]);
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
          <motion.div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            className="relative max-h-[88vh] overflow-y-auto bg-paper shadow-2xl"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.5 }}
          >
            <CmykBar />
            <div className="container-x py-6 sm:py-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex items-center gap-3 border-b-2 border-ink pb-3"
              >
                <Search className="h-6 w-6 shrink-0 text-muted" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="display min-w-0 flex-1 bg-transparent text-2xl outline-none placeholder:text-muted/50 sm:text-4xl"
                />
                <button type="button" onClick={close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-ink/5" aria-label="Close">
                  <X className="h-6 w-6" />
                </button>
              </form>

              {!q.trim() ? (
                <div className="grid gap-8 py-8 md:grid-cols-[1fr_2fr]">
                  <div>
                    <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{t('popularSearches')}</div>
                    <div className="flex flex-wrap gap-2">
                      {popular.map((p) => (
                        <button key={p} onClick={() => setQ(p)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[13.5px] font-medium text-ink-soft transition-colors hover:border-ink hover:bg-ink hover:text-paper">
                          <Search className="h-3.5 w-3.5 opacity-60" /> {p}
                        </button>
                      ))}
                    </div>
                    <Link to="/kerko-oferte" onClick={close} className="mt-6 inline-flex items-center gap-2 text-[13.5px] font-semibold text-brand-700 hover:text-brand-800">
                      <FileText className="h-4 w-4" /> {t('requestQuote')} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div>
                    <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">{t('categories')}</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {cats.map((c) => (
                        <Link key={c.id} to={`/produktet/${c.slug}`} onClick={close} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white">
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                            <Img src={c.image} small alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </span>
                          <span className="text-[13.5px] font-semibold text-ink">{l(c.name)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted">{t('noResults', { q })}</p>
                  <Link to="/kerko-oferte" onClick={close} className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-brand-700 hover:text-brand-800">
                    <FileText className="h-4 w-4" /> {t('requestQuote')} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="py-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{t('results', { n: results.length })}</span>
                    <button onClick={submit} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-brand-700">
                      {t('seeAll')} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {results.slice(0, 9).map((p) => (
                      <Link key={p.id} to={`/produkt/${p.slug}`} onClick={close} className="flex items-center gap-4 rounded-2xl p-2.5 transition-colors hover:bg-white">
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line">
                          <Img src={p.images[0]} small alt="" className="h-full w-full object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-sm font-semibold text-ink">{l(p.name)}</span>
                          <Price product={p} size="sm" className="mt-0.5" />
                        </span>
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
