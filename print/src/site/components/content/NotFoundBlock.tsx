import type { ReactNode } from 'react';
import { Accent } from '@/components/ui/misc';
import { CmykBar, CropMarks, Eyebrow } from '@/site/components/company/Print';

/** "Not found" panel for unknown post / page slugs — a blank press sheet with crop marks. */
export function NotFoundBlock({ icon, eyebrow, title, text, actions, children }: { icon: ReactNode; eyebrow: string; title: string; text: string; actions: ReactNode; children?: ReactNode }) {
  return (
    <section className="container-x py-16 sm:py-24">
      <div className="relative mx-auto max-w-4xl">
        <CropMarks size={16} gap={8} />
        <div className="relative overflow-hidden rounded-2xl bg-white px-6 pb-12 pt-14 text-center ring-1 ring-line sm:px-14 sm:pb-16 sm:pt-20">
          <div aria-hidden className="pointer-events-none absolute right-5 top-5 font-mono text-[11px] tracking-[0.16em] text-muted">404</div>
          <span className="mx-auto grid h-14 w-14 animate-pop place-items-center rounded-2xl bg-ink text-white">{icon}</span>
          <div className="mt-7 flex justify-center">
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
          <h1 className="display mt-4 text-[34px] leading-[1.05] text-ink sm:text-[50px]">
            <Accent text={title} />
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-muted">{text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
          {children && <div className="relative mt-14 border-t border-line pt-10 text-left">{children}</div>}
          <CmykBar className="absolute inset-x-0 bottom-0" />
        </div>
      </div>
    </section>
  );
}
