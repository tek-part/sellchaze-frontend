/**
 * Navigation view-models — header menu, mega-menu columns, footer link groups. Carried on
 * StorefrontContext.navigation (Phase 6 fills from the backend menu). Sections/chrome read these.
 */
/** One titled column inside a mega-menu panel. */
export interface NavColumn {
  title: string;
  items: ReadonlyArray<NavItem>;
}

export interface NavItem {
  label: string;
  url: string;
  /** Sub-items (mega-menu first column / mobile accordion). */
  children?: ReadonlyArray<NavItem>;
  /**
   * Additional titled columns for a mega-menu panel, rendered after `children`. Absent when the
   * item is a plain dropdown, so a store with no categories degrades to a simple menu rather than
   * an empty panel.
   */
  columns?: ReadonlyArray<NavColumn>;
  /** Optional feature image for a mega-menu column. */
  image?: string;
}

export interface FooterGroup {
  title: string;
  links: ReadonlyArray<{ label: string; url: string }>;
}
