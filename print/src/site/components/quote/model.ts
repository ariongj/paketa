import { BookOpen, Milk, Package, Pizza, ShoppingBag, Sparkles, Tag, type LucideIcon } from 'lucide-react';
import type { L10n } from '@/lib/types';
import type { RfqKind } from './kinds';

const T = (sq: string, en: string): L10n => ({ sq, en });

export const KIND_ICON: Record<RfqKind, LucideIcon> = {
  box: Package,
  food: Pizza,
  label: Tag,
  sleeve: Milk,
  bag: ShoppingBag,
  print: BookOpen,
  other: Sparkles,
};

/** How dimensions are asked: 3D (boxes, bags), flat (labels, sleeves) or free text. */
export const SIZE_MODE: Record<RfqKind, 'box' | 'flat' | 'free'> = {
  box: 'box',
  food: 'box',
  bag: 'box',
  label: 'flat',
  sleeve: 'flat',
  print: 'free',
  other: 'free',
};

export const MATERIALS: Record<RfqKind, L10n[]> = {
  box: [T('Karton GC1 300 g', 'GC1 300 gsm board'), T('Karton GC2 350 g', 'GC2 350 gsm board'), T('Kraft natyral', 'Natural kraft'), T('Mikrovalë E (e valëzuar)', 'E-flute corrugated'), T('Kuti e fortë (rigid)', 'Rigid box')],
  food: [T('Karton për kontakt me ushqim', 'Food-contact board'), T('Kraft natyral', 'Natural kraft'), T('Mikrovalë E (e valëzuar)', 'E-flute corrugated'), T('Karton me barrierë ndaj yndyrës', 'Grease-barrier board')],
  label: [T('Letër semi-gloss', 'Semi-gloss paper'), T('PP e bardhë', 'White PP'), T('PP transparente', 'Clear PP'), T('PP metalike argjendi', 'Metallic silver PP'), T('Letër vere e strukturuar', 'Textured wine paper')],
  sleeve: [T('PETG', 'PETG'), T('PVC', 'PVC'), T('OPS', 'OPS')],
  bag: [T('Kraft kafe', 'Brown kraft'), T('Kraft i bardhë', 'White kraft'), T('Art letër + laminim', 'Art paper + lamination')],
  print: [T('Letër mat 150–170 g', 'Matte paper 150–170 gsm'), T('Letër me shkëlqim', 'Gloss paper'), T('Karton 300–400 g', '300–400 gsm board'), T('Letër e riciklueshme', 'Recycled paper')],
  other: [],
};

export type Colours = 'cmyk' | 'cmykPantone' | 'pantone' | 'none';
export const COLOURS: Colours[] = ['cmyk', 'cmykPantone', 'pantone', 'none'];
export const COLOUR_TEXT: Record<Colours, string> = { cmyk: 'CMYK', cmykPantone: 'CMYK + Pantone', pantone: 'Pantone', none: '—' };

export type Finish = 'matte' | 'gloss' | 'softtouch' | 'spotuv' | 'foil' | 'emboss' | 'window';
export const FINISHES: Finish[] = ['matte', 'gloss', 'softtouch', 'spotuv', 'foil', 'emboss', 'window'];

export const QTY_PRESETS: Record<RfqKind, number[]> = {
  box: [500, 1000, 2500, 5000, 10000],
  food: [1000, 2500, 5000, 10000, 25000],
  label: [1000, 5000, 10000, 25000, 50000],
  sleeve: [5000, 10000, 25000, 50000, 100000],
  bag: [250, 500, 1000, 2500, 5000],
  print: [250, 500, 1000, 2500, 5000],
  other: [250, 1000, 5000, 10000],
};

export interface RfqFile {
  name: string;
  size: number;
}

export interface RfqForm {
  kind: RfqKind | null;
  len: string;
  wid: string;
  hei: string;
  sizeText: string;
  material: string;
  qty: string;
  colours: Colours;
  pantone: string;
  finishes: Finish[];
  deadline: string;
  flexible: boolean;
  files: RfqFile[];
  design: boolean;
  sample: boolean;
  company: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  message: string;
}

export const EMPTY_RFQ: RfqForm = {
  kind: null,
  len: '',
  wid: '',
  hei: '',
  sizeText: '',
  material: '',
  qty: '',
  colours: 'cmyk',
  pantone: '',
  finishes: [],
  deadline: '',
  flexible: false,
  files: [],
  design: false,
  sample: false,
  company: '',
  name: '',
  email: '',
  phone: '',
  city: '',
  message: '',
};

/** "120 × 80 × 40 mm" from the form (or the free text). */
export function sizeText(f: RfqForm): string {
  if (!f.kind) return '';
  const mode = SIZE_MODE[f.kind];
  if (mode === 'free') return f.sizeText.trim();
  const parts = (mode === 'box' ? [f.len, f.wid, f.hei] : [f.wid, f.hei]).map((v) => v.trim()).filter(Boolean);
  return parts.length ? `${parts.join(' × ')} mm` : '';
}

export const RFQ_FILE_EXT = ['pdf', 'ai', 'eps', 'svg', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'zip', 'psd', 'cdr'];
