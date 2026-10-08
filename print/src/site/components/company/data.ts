import { useMemo } from 'react';
import type { HomeSection, HomeSectionType } from '@/lib/types';
import { useDb } from '@/store/db';

export type SectionData<T extends HomeSectionType> = Extract<HomeSection, { type: T }>['data'];

/**
 * Content of a homepage section, looked up by type. The company pages reuse
 * CMS-managed homepage blocks (faq…) so the client edits that content in one
 * place. Visibility on the homepage does not matter here.
 */
export function useHomeData<T extends HomeSectionType>(type: T): SectionData<T> | undefined {
  const home = useDb((s) => s.home);
  return useMemo(() => home.find((h) => h.type === type)?.data as SectionData<T> | undefined, [home, type]);
}

/** Smooth-scroll to an in-page anchor without touching the URL. */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** wa.me link from a human-formatted number ("+383 49 732 700" → https://wa.me/38349732700). */
export const waHref = (phone: string | undefined) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
};

/** Where every "request a quote" button on the company pages points. */
export const QUOTE_HREF = '/kerko-oferte';
