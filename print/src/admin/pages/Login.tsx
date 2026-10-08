import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { LangSwitcher } from '@/components/LangSwitcher';
import { useDict, useL } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { brandVars } from '@/lib/color';
import { asset } from '@/lib/paths';
import { num } from '@/lib/format';
import { sleep } from '@/lib/utils';

// Demo credentials (local demo only — not a real auth system)
const DEMO_EMAIL = 'admin@printwor-ks.com';
const DEMO_PASSWORD = 'printworks2026';

/** Product mock-ups shown on the brand side (first ones that exist in the catalogue). */
const SHOWCASE = ['p-kuti-pice', 'p-etiketa-vere', 'p-qese-premium', 'p-kuti-kozmetike'];

/** Thin CMYK registration strip — the print motif used across the storefront. */
function ColourBar({ className }: { className?: string }) {
  return (
    <span className={`flex h-1 w-24 overflow-hidden rounded-full ${className ?? ''}`} aria-hidden>
      <span className="flex-1 bg-cyan" />
      <span className="flex-1 bg-magenta" />
      <span className="flex-1 bg-yellow" />
      <span className="flex-1 bg-white/80" />
    </span>
  );
}

export default function Login() {
  const t = useDict(adm, 'admin');
  const l = useL('admin');
  const authed = useUi((s) => s.adminAuthed);
  const login = useUi((s) => s.login);
  const adminEmail = useDb((s) => s.settings.adminEmail) || DEMO_EMAIL;
  const brandColor = useDb((s) => s.settings.brandColor);
  const products = useDb((s) => s.products);
  const orders = useDb((s) => s.orders);
  const inquiries = useDb((s) => s.inquiries);
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // Live figures from the demo store — the panel the client is about to open
  const stats = useMemo(
    () => [
      { label: t('loginStat1'), value: orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length },
      { label: t('loginStat2'), value: inquiries.filter((q) => q.type === 'quote' && q.status !== 'done').length },
      { label: t('loginStat3'), value: products.filter((p) => p.status === 'active').length },
    ],
    [orders, inquiries, products, t],
  );
  const showcase = useMemo(() => {
    const picked = SHOWCASE.map((id) => products.find((p) => p.id === id && p.images[0])).filter((p): p is NonNullable<typeof p> => !!p);
    const rest = products.filter((p) => p.status === 'active' && p.featured && p.images[0] && !picked.includes(p));
    return [...picked, ...rest].slice(0, 3);
  }, [products]);

  if (authed) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    await sleep(500);
    const mail = email.trim().toLowerCase();
    // The configured admin e-mail (Settings) or the demo address both open the demo
    if ((mail === adminEmail.toLowerCase() || mail === DEMO_EMAIL) && password === DEMO_PASSWORD) {
      login();
      navigate('/admin');
    } else {
      setError(t('wrongPassword'));
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      {/* Brand side — the storefront look (PrintWorks purple is allowed here, outside the neutral work area) */}
      <div className="relative hidden overflow-hidden bg-[#121014] lg:block" style={brandVars(brandColor)}>
        <img src={asset('/images/misc/production.webp')} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_35%] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121014] via-[#121014]/75 to-[#121014]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_srgb,var(--color-brand-600)_38%,transparent),transparent)]" />

        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-14">
          <div className="flex items-center justify-between">
            <Logo tone="light" className="h-9" />
            <ColourBar />
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55">{t('loginEyebrow')}</p>
            <p className="display mt-4 max-w-lg text-[44px] leading-[1.04] text-white">{t('loginHero')}</p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">{t('loginHeroText')}</p>

            {showcase.length > 0 && (
              <div className="mt-10 flex gap-3">
                {showcase.map((p) => (
                  <figure key={p.id} className="w-[132px] overflow-hidden rounded-2xl bg-white p-2 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
                    <img src={asset(p.images[0].replace(/\.webp$/, '-sm.webp'))} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    <figcaption className="truncate px-1 pb-0.5 pt-2 text-[11.5px] font-medium text-[#121014]">{l(p.name)}</figcaption>
                  </figure>
                ))}
              </div>
            )}

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-[12px] text-white/50">{s.label}</dt>
                  <dd className="mt-1 font-mono text-[26px] font-medium tabular-nums text-white">{num(s.value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Form side — neutral CMS */}
      <div className="relative flex flex-col bg-[#f7f7f7]">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {t('backToSite')}
          </Link>
          <LangSwitcher scope="admin" />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <form onSubmit={submit} className="w-full max-w-[380px]">
            <div className="mb-10 lg:hidden" style={brandVars(brandColor)}>
              <Logo className="h-9" />
            </div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted">CMS · PrintWorks</p>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight text-ink">{t('loginTitle')}</h1>
            <p className="mt-2 text-[14px] text-muted">{t('loginText')}</p>
            <div className="mt-8 space-y-4">
              <Input
                label={t('email')}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                leading={<Mail className="h-4 w-4" />}
                autoComplete="username"
                className="bg-white"
              />
              <Input
                label={t('password')}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                leading={<Lock className="h-4 w-4" />}
                error={error}
                autoComplete="current-password"
                className="bg-white"
              />
            </div>
            <Button type="submit" size="lg" shape="rounded" className="mt-6 w-full" loading={busy}>
              {t('login')}
            </Button>
            <p className="mt-4 flex items-start gap-2 rounded-xl border border-black/[0.08] bg-white p-3 text-[13px] leading-snug text-ink-soft">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <span>
                {t('demoHint')}
                <span className="mt-1 block font-mono text-[12px] text-muted">
                  {DEMO_EMAIL} · {DEMO_PASSWORD}
                </span>
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
