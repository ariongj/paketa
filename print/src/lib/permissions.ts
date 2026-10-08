// Roles & permissions — CMS proposal p.42 ("Leje sipas veprimit, jo vetëm sipas faqes").
// role → module → allowed actions. The admin menu and buttons read `can(role, module, action)`.
import type { L10n, RoleId } from './types';

export const MODULES = [
  'overview',
  'orders',
  'drafts',
  'returns',
  'products',
  'collections',
  'inventory',
  'purchasing',
  'customers',
  'segments',
  'offers',
  'discounts',
  'content',
  'onlineStore',
  'markets',
  'analytics',
  'contacts',
  'quotes',
  'appointments',
  'integrations',
  'settings',
  'staff',
] as const;
export type Module = (typeof MODULES)[number];

export const ACTIONS = ['view', 'edit', 'publish', 'archive', 'delete', 'import', 'export', 'viewCost', 'refund', 'cancel'] as const;
export type Action = (typeof ACTIONS)[number];

export const ROLES: RoleId[] = ['owner', 'manager', 'catalog', 'orders', 'editor', 'marketing', 'reception'];

export const ROLE_META: Record<RoleId, { name: L10n; description: L10n }> = {
  owner: {
    name: { sq: 'Pronar', en: 'Owner' },
    description: { sq: 'Administrim i plotë, stafi dhe konfigurimet.', en: 'Full administration, staff and settings.' },
  },
  manager: {
    name: { sq: 'Menaxher', en: 'Manager' },
    description: { sq: 'Operacione dhe raporte: porosi, katalog, oferta, kontakte.', en: 'Operations and reports: orders, catalogue, campaigns, contacts.' },
  },
  catalog: {
    name: { sq: 'Katalog', en: 'Catalogue' },
    description: { sq: 'Produkte, koleksione, media dhe inventar.', en: 'Products, collections, media and inventory.' },
  },
  orders: {
    name: { sq: 'Porosi', en: 'Orders' },
    description: { sq: 'Porositë, prepress, dërgesat dhe kontakti me klientët.', en: 'Orders, prepress, shipping and customer contact.' },
  },
  editor: {
    name: { sq: 'Redaktor', en: 'Editor' },
    description: { sq: 'Faqe, blog dhe përmbajtje.', en: 'Pages, blog and site content.' },
  },
  marketing: {
    name: { sq: 'Marketing', en: 'Marketing' },
    description: { sq: 'Oferta dhe zbritje — publikimi miratohet nga menaxheri.', en: 'Offers and discounts — publishing approved by a manager.' },
  },
  reception: {
    name: { sq: 'Recepsion', en: 'Reception' },
    description: { sq: 'Kontakte, kërkesa dhe termine.', en: 'Contacts, enquiries and appointments.' },
  },
};

type Matrix = Partial<Record<Module, readonly Action[]>>;

const ALL: readonly Action[] = ACTIONS;
const READ: readonly Action[] = ['view'];
const READ_EXPORT: readonly Action[] = ['view', 'export'];
const MANAGE: readonly Action[] = ['view', 'edit', 'publish', 'archive', 'export'];

/** Owner gets everything (handled in `can`). */
export const PERMISSIONS: Record<Exclude<RoleId, 'owner'>, Matrix> = {
  manager: {
    overview: READ,
    orders: ['view', 'edit', 'export', 'refund', 'cancel', 'archive'],
    drafts: ['view', 'edit', 'delete', 'export'],
    returns: ['view', 'edit', 'refund'],
    products: ['view', 'edit', 'publish', 'archive', 'import', 'export', 'viewCost'],
    collections: MANAGE,
    inventory: ['view', 'edit', 'export', 'viewCost'],
    purchasing: ['view', 'edit', 'export', 'viewCost'],
    customers: ['view', 'edit', 'export'],
    segments: ['view', 'edit'],
    offers: [...MANAGE, 'delete'],
    discounts: [...MANAGE, 'delete'],
    content: MANAGE,
    onlineStore: MANAGE,
    markets: READ,
    analytics: READ_EXPORT,
    contacts: ['view', 'edit', 'archive', 'export'],
    quotes: ['view', 'edit', 'publish', 'export'],
    appointments: ['view', 'edit', 'cancel'],
    integrations: READ,
    settings: READ,
    staff: READ,
  },
  catalog: {
    overview: READ,
    products: ['view', 'edit', 'publish', 'archive', 'import', 'export', 'viewCost'],
    collections: MANAGE,
    inventory: ['view', 'edit', 'export', 'viewCost'],
    purchasing: ['view', 'edit', 'viewCost'],
    content: ['view'],
    onlineStore: ['view'],
    analytics: READ,
  },
  orders: {
    overview: READ,
    orders: ['view', 'edit', 'export', 'cancel'],
    drafts: ['view', 'edit'],
    returns: ['view', 'edit'],
    products: READ,
    inventory: ['view', 'edit'],
    customers: ['view', 'edit'],
    contacts: ['view', 'edit'],
    quotes: READ,
    appointments: ['view', 'edit'],
  },
  editor: {
    overview: READ,
    products: READ,
    collections: ['view', 'edit'],
    content: ['view', 'edit', 'publish', 'archive', 'delete'],
    onlineStore: ['view', 'edit', 'publish'],
  },
  marketing: {
    overview: READ,
    products: READ,
    collections: ['view', 'edit'],
    customers: READ,
    segments: ['view', 'edit'],
    // preparation is separate from activation (p.42): no 'publish' on offers/discounts/storefront
    offers: ['view', 'edit', 'archive', 'export'],
    discounts: ['view', 'edit', 'archive', 'export'],
    content: ['view', 'edit'],
    onlineStore: ['view', 'edit'],
    analytics: READ_EXPORT,
  },
  reception: {
    overview: READ,
    customers: READ,
    contacts: ['view', 'edit'],
    quotes: READ,
    appointments: ['view', 'edit', 'cancel'],
  },
};

/** Can `role` perform `action` in `module`? Owner can do everything. */
export function can(role: RoleId, module: Module, action: Action = 'view'): boolean {
  if (role === 'owner') return true;
  return PERMISSIONS[role]?.[module]?.includes(action) ?? false;
}

/** Allowed actions for a role in a module (owner → all). */
export function actionsFor(role: RoleId, module: Module): readonly Action[] {
  if (role === 'owner') return ALL;
  return PERMISSIONS[role]?.[module] ?? [];
}

/** Modules the role can open — drives the admin sidebar. */
export function modulesFor(role: RoleId): Module[] {
  return MODULES.filter((m) => can(role, m, 'view'));
}
