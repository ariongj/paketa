import { useEffect, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import type { HomeSection } from '@/lib/types';
import { useDb } from '@/store/db';
import { usePageTitle } from '@/site/layout/SiteLayout';
import { HeroSection } from '@/site/sections/Hero';
import {
  BlogSection, CategoriesSection, CtaSection, FaqSection, FeaturedSection, InstagramSection, ProcessSection,
  ProjectsSection, PromoSection, ServicesSection, StatsSection, TrustSection,
} from '@/site/sections/HomeSections';
import { IndustriesSection, LogosSection, TechnologySection } from '@/site/sections/PrintSections';

function renderSection(s: HomeSection): ReactNode {
  switch (s.type) {
    case 'hero':
      return <HeroSection slides={s.data.slides} autoplay={s.data.autoplay} />;
    case 'trust':
      return <TrustSection data={s.data} />;
    case 'categories':
      return <CategoriesSection data={s.data} />;
    case 'featured':
      return <FeaturedSection data={s.data} />;
    case 'promo':
      return <PromoSection data={s.data} />;
    case 'process':
      return <ProcessSection data={s.data} />;
    case 'services':
      return <ServicesSection data={s.data} />;
    case 'projects':
      return <ProjectsSection data={s.data} />;
    case 'stats':
      return <StatsSection data={s.data} />;
    case 'blog':
      return <BlogSection data={s.data} />;
    case 'faq':
      return <FaqSection data={s.data} />;
    case 'instagram':
      return <InstagramSection data={s.data} />;
    case 'cta':
      return <CtaSection data={s.data} />;
    case 'industries':
      return <IndustriesSection data={s.data} />;
    case 'technology':
      return <TechnologySection data={s.data} />;
    case 'logos':
      return <LogosSection data={s.data} />;
    default:
      return null;
  }
}

/** Sections the storefront shows: the published homepage, or the unpublished draft with ?preview=1 (CMS builder). */
function useHomeSections() {
  const live = useDb((s) => s.home);
  const draft = useDb((s) => s.homeDraft);
  const [params] = useSearchParams();
  const preview = params.get('preview') === '1';
  const home = preview ? (draft ?? live) : live;
  return useMemo(() => home.filter((s) => s.enabled), [home]);
}

export default function Home() {
  const enabled = useHomeSections();
  usePageTitle(undefined);

  // CMS live preview: the homepage builder posts { type: 'pw:scrollTo', id } into this iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'pw:scrollTo') return;
      const el = document.querySelector<HTMLElement>(`[data-section="${e.data.id}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('preview-highlight');
      window.setTimeout(() => el.classList.remove('preview-highlight'), 1600);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      {enabled.map((s) => (
        <div key={s.id} data-section={s.id} className="scroll-mt-24">
          {renderSection(s)}
        </div>
      ))}
    </>
  );
}
