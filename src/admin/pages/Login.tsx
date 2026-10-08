import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { LangSwitcher } from '@/components/LangSwitcher';
import { useDict } from '@/i18n';
import { adm } from '@/admin/i18n';
import { useUi } from '@/store/ui';
import { useDb } from '@/store/db';
import { sleep } from '@/lib/utils';

// Demo credentials (local demo only — not a real auth system). The e-mail set in
// Settings → Notifications (`settings.adminEmail`) is accepted as well.
const DEMO_EMAIL = 'admin@paketoje.com';
const DEMO_PASSWORD = 'paketoje2026';

export default function Login() {
  const t = useDict(adm, 'admin');
  const authed = useUi((s) => s.adminAuthed);
  const login = useUi((s) => s.login);
  const adminEmail = useDb((s) => s.settings.adminEmail);
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (authed) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await sleep(500);
    const typed = email.trim().toLowerCase();
    const known = typed === DEMO_EMAIL || (!!adminEmail && typed === adminEmail.trim().toLowerCase());
    if (known && password === DEMO_PASSWORD) {
      login();
      navigate('/admin');
    } else {
      setError(t('wrongPassword'));
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#1a1a1a] lg:block">
        <img src="/images/misc/kraft-cups.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale-[35%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/45 to-[#1a1a1a]/30" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <Logo tone="light" className="h-12" />
            <span className="h-6 w-px bg-white/25" aria-hidden />
            <span className="text-[19px] font-extrabold tracking-tight text-white/90">CMS</span>
          </div>
          <div>
            <p className="max-w-md text-[40px] font-extrabold leading-[1.08] tracking-tight">{t('loginHero')}</p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">{t('loginHeroText')}</p>
            <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">Paketoje · Mitrovicë · it's packaging</p>
          </div>
        </div>
      </div>
      <div className="relative flex flex-col bg-canvas">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> {t('backToSite')}
          </Link>
          <LangSwitcher scope="admin" />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <form onSubmit={submit} className="w-full max-w-sm">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <Logo className="h-11" />
              <span className="h-6 w-px bg-black/15" aria-hidden />
              <span className="text-[18px] font-extrabold tracking-tight text-ink">CMS</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('loginTitle')}</h1>
            <p className="mt-2 text-muted">{t('loginText')}</p>
            <div className="mt-8 space-y-4">
              <Input label={t('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} leading={<Mail className="h-4 w-4" />} autoComplete="username" />
              <Input label={t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} leading={<Lock className="h-4 w-4" />} error={error} autoComplete="current-password" />
            </div>
            <Button type="submit" size="lg" shape="rounded" className="mt-6 w-full" loading={busy}>
              {t('login')}
            </Button>
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-black/[0.06] bg-white p-3 text-[13px] text-ink-soft">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <span className="min-w-0">
                {t('demoHint')}
                <span className="mt-1 block font-mono text-[12px] text-muted">
                  {DEMO_EMAIL} · {DEMO_PASSWORD}
                </span>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
