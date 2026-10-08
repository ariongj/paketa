// Icons a homepage "trust" item can use. Shared by the storefront and the homepage builder's icon picker,
// so both always offer exactly the same set.
import type { ComponentType } from 'react';
import {
  Award, BadgeCheck, Box, Clock, Factory, FileCheck, Globe, Layers, Leaf, Package, Palette, Phone, Printer, Ruler, Scissors,
  ShieldCheck, Sparkles, Star, Truck, Zap,
} from 'lucide-react';

export type IconC = ComponentType<{ className?: string; strokeWidth?: number }>;

export const HOME_ICONS: { name: string; icon: IconC }[] = [
  { name: 'Clock', icon: Clock },
  { name: 'Layers', icon: Layers },
  { name: 'Printer', icon: Printer },
  { name: 'Truck', icon: Truck },
  { name: 'FileCheck', icon: FileCheck },
  { name: 'Palette', icon: Palette },
  { name: 'Package', icon: Package },
  { name: 'Box', icon: Box },
  { name: 'Scissors', icon: Scissors },
  { name: 'Factory', icon: Factory },
  { name: 'Leaf', icon: Leaf },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'BadgeCheck', icon: BadgeCheck },
  { name: 'Award', icon: Award },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Zap', icon: Zap },
  { name: 'Globe', icon: Globe },
  { name: 'Ruler', icon: Ruler },
  { name: 'Star', icon: Star },
  { name: 'Phone', icon: Phone },
];

/** Icon by name (unknown names fall back to Sparkles). */
export const homeIcon = (name: string): IconC => HOME_ICONS.find((i) => i.name === name)?.icon ?? Sparkles;
