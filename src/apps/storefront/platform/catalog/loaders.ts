import type { ThemeLoader } from '../../theme-engine/types';

/** Shared runtime loaders. Storefront boot needs these, without marketplace listing metadata. */
export const THEME_LOADERS = {
  'elite-furniture': () => import('../../themes/elite-furniture').then(module => module.eliteTheme),
  'nature-kids': () => import('../../themes/nature-kids').then(module => module.kidsTheme),
  'pure-furniture': () => import('../../themes/pure-furniture').then(module => module.pureTheme),
  'sphinx-v3': () => import('../../themes/sphinx').then(module => module.sphinxTheme),
  naseem: () => import('../../themes/naseem').then(module => module.naseemTheme),
  bazaar: () => import('../../themes/bazaar').then(module => module.bazaarTheme),
  sahra: () => import('../../themes/sahra').then(module => module.sahraTheme),
  fresh: () => import('../../themes/fresh').then(module => module.freshTheme),
  techno: () => import('../../themes/techno').then(module => module.technoTheme),
} satisfies Readonly<Record<string, ThemeLoader>>;
