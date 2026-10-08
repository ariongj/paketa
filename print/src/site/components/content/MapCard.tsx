import { useMemo } from 'react';
import { ArrowUpRight, MapPinned } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { buttonClass } from '@/components/ui/Button';
import { useDict } from '@/i18n';
import { useSettings } from '@/store/hooks';
import { cn, rng } from '@/lib/utils';
import { C } from './dict';

/* Stylised, dependency-free "map" of an industrial zone: a rotated street grid,
   large factory lots, a ring road and a soft highlighted AREA (not a pin — the
   street address in Settings is a placeholder, so we never pretend it is exact).
   The SVG uses `slice` scaling, so its centre (400,320) is always the card centre. */
const VW = 800;
const VH = 640;
const CELL = 80;

const RING_ROAD = 'M -40 470 C 160 430 280 380 400 330 C 540 272 660 210 840 160';
const SIDE_ROAD = 'M 300 -40 C 330 110 370 220 400 330 C 430 440 470 560 500 680';

type Lot = { x: number; y: number; w: number; h: number; o: number; green: boolean };

function useLots() {
  return useMemo(() => {
    const r = rng(7);
    const out: Lot[] = [];
    for (let row = -3; row < 11; row++) {
      for (let col = -3; col < 13; col++) {
        const v = r();
        if (v < 0.08) continue;
        const green = v > 0.94;
        const x = col * CELL + 10;
        const y = row * CELL + 10;
        const s = CELL - 20;
        const o = 0.5 + r() * 0.5;
        // factory halls: some lots merge into long buildings
        if (!green && r() > 0.7) out.push({ x, y: y + s * 0.15, w: s, h: s * 0.7, o, green });
        else out.push({ x, y, w: s, h: s, o, green });
      }
    }
    return out;
  }, []);
}

export function MapCard({ className }: { className?: string }) {
  const c = useDict(C);
  const settings = useSettings();
  const lots = useLots();

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line', className)}>
      <div className="relative min-h-[300px] flex-1 overflow-hidden bg-[#eceaef] sm:min-h-[360px]">
        <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect width={VW} height={VH} fill="#eceaef" />
          <g transform={`rotate(-14 ${VW / 2} ${VH / 2})`}>
            {lots.map((b, i) => (
              <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={4} fill={b.green ? '#dfe6dc' : '#dcd8e1'} fillOpacity={b.green ? 1 : b.o} />
            ))}
            {Array.from({ length: 17 }, (_, k) => (k - 3) * CELL).map((p) => (
              <g key={p} stroke="#f8f7fa" strokeLinecap="round">
                <line x1={p} y1={-300} x2={p} y2={VH + 300} strokeWidth={(p / CELL) % 3 === 0 ? 8 : 4} />
                <line x1={-300} y1={p} x2={VW + 300} y2={p} strokeWidth={(p / CELL) % 3 === 0 ? 8 : 4} />
              </g>
            ))}
          </g>
          <path d={SIDE_ROAD} fill="none" stroke="#d5d1da" strokeWidth={16} strokeLinecap="round" />
          <path d={SIDE_ROAD} fill="none" stroke="#ffffff" strokeWidth={11} strokeLinecap="round" />
          <path d={RING_ROAD} fill="none" stroke="#cfc9d6" strokeWidth={22} strokeLinecap="round" />
          <path d={RING_ROAD} fill="none" stroke="#ffffff" strokeWidth={16} strokeLinecap="round" />
          <path d={RING_ROAD} fill="none" stroke="#d5d1da" strokeWidth={1.5} strokeDasharray="10 12" />
          {/* highlighted area */}
          <circle cx={400} cy={320} r={118} className="fill-brand-600" fillOpacity={0.08} />
          <circle cx={400} cy={320} r={118} fill="none" className="stroke-brand-600" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="5 7" />
          <circle cx={400} cy={320} r={56} className="fill-brand-600" fillOpacity={0.1} />
        </svg>
        <div className="bg-grain pointer-events-none absolute inset-0" />

        {/* area label */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white py-1.5 pl-2 pr-3.5 text-[12.5px] font-semibold text-ink shadow-[0_14px_30px_-14px_rgba(18,16,20,0.45)] ring-1 ring-line">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-paper ring-1 ring-line">
            <LogoMark className="h-[11px]" />
          </span>
          {settings.companyName} · {settings.city}
        </div>

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-soft ring-1 ring-line backdrop-blur">
          <span className="h-2 w-2 rounded-full border border-brand-600 bg-brand-600/20" />
          {c('map_area')}
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-line p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{c('map_eyebrow')}</div>
            <div className="display mt-2 text-[30px] leading-none text-ink">{settings.city}</div>
            <div className="mt-2 text-[14.5px] text-muted">
              {settings.legalName} · {settings.address}
            </div>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <MapPinned className="h-5 w-5" />
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">{c('map_note')}</p>
        <a href={settings.mapUrl} target="_blank" rel="noreferrer" className={buttonClass({ variant: 'outline', className: 'self-start' })}>
          {c('map_open')}
          <ArrowUpRight className="h-4 w-4 opacity-60" />
        </a>
      </div>
    </div>
  );
}
