/**
 * Google Fonts catalog — maps font family names to their API loading parameters.
 * Used to dynamically load only the fonts actually referenced in a document.
 */

export interface GoogleFontDef {
  /** URL-safe family name for the API (spaces → '+') */
  family: string;
  /** Weight axis, e.g. '400;500;600;700' or '100..900' for variable */
  weights: string;
  /** CSS generic fallback */
  fallback: 'sans-serif' | 'serif' | 'monospace' | 'cursive' | 'system-ui';
  /** UI category for the font picker */
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting';
}

// ---------------------------------------------------------------------------
// Sans-serif (~35)
// ---------------------------------------------------------------------------

const sans = (family: string, weights = '400;500;600;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'),
  weights,
  fallback: 'sans-serif',
  category: 'sans-serif',
});

// ---------------------------------------------------------------------------
// Serif (~25)
// ---------------------------------------------------------------------------

const serif = (family: string, weights = '400;500;600;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'),
  weights,
  fallback: 'serif',
  category: 'serif',
});

// ---------------------------------------------------------------------------
// Display (~20)
// ---------------------------------------------------------------------------

const display = (family: string, weights = '400;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'),
  weights,
  fallback: 'sans-serif',
  category: 'display',
});

// ---------------------------------------------------------------------------
// Monospace (~10)
// ---------------------------------------------------------------------------

const mono = (family: string, weights = '400;500;600;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'),
  weights,
  fallback: 'monospace',
  category: 'monospace',
});

// ---------------------------------------------------------------------------
// Handwriting (~10)
// ---------------------------------------------------------------------------

const hand = (family: string, weights = '400;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'),
  weights,
  fallback: 'cursive',
  category: 'handwriting',
});

/**
 * Complete catalog of supported Google Fonts.
 * Key = exact CSS font-family name (the name users write in CSS).
 */
export const GOOGLE_FONTS: Record<string, GoogleFontDef> = {
  // ── Sans-serif ──
  'Inter': sans('Inter'),
  'Roboto': sans('Roboto', '400;500;700;900'),
  'Open Sans': sans('Open Sans'),
  'Lato': sans('Lato', '400;700;900'),
  'Montserrat': sans('Montserrat', '400;500;600;700;800'),
  'Poppins': sans('Poppins', '400;500;600;700'),
  'Nunito': sans('Nunito', '400;500;600;700;800'),
  'Raleway': sans('Raleway', '400;500;600;700'),
  'Work Sans': sans('Work Sans'),
  'DM Sans': sans('DM Sans', '400;500;600;700'),
  'Plus Jakarta Sans': sans('Plus Jakarta Sans', '400;500;600;700;800'),
  'Outfit': sans('Outfit', '400;500;600;700'),
  'Manrope': sans('Manrope', '400;500;600;700;800'),
  'Figtree': sans('Figtree', '400;500;600;700'),
  'Source Sans 3': sans('Source Sans 3'),
  'Noto Sans': sans('Noto Sans', '400;500;600;700'),
  'Barlow': sans('Barlow', '400;500;600;700'),
  'Lexend': sans('Lexend', '400;500;600;700'),
  'Public Sans': sans('Public Sans'),
  'Archivo': sans('Archivo', '400;500;600;700;800'),
  'Rubik': sans('Rubik', '400;500;600;700'),
  'Mulish': sans('Mulish', '400;500;600;700;800'),
  'Exo 2': sans('Exo 2', '400;500;600;700'),
  'Karla': sans('Karla', '400;500;600;700'),
  'Mukta': sans('Mukta', '400;500;600;700;800'),
  'Quicksand': sans('Quicksand', '400;500;600;700'),
  'Cabin': sans('Cabin', '400;500;600;700'),
  'Josefin Sans': sans('Josefin Sans', '400;500;600;700'),
  'Saira': sans('Saira', '400;500;600;700'),
  'Albert Sans': sans('Albert Sans'),
  'Sora': sans('Sora', '400;500;600;700;800'),
  'Space Grotesk': sans('Space Grotesk', '400;500;600;700'),
  'Red Hat Display': sans('Red Hat Display', '400;500;600;700'),
  'Urbanist': sans('Urbanist', '400;500;600;700;800'),
  'Geist': sans('Geist', '400;500;600;700'),

  // ── Serif ──
  'Merriweather': serif('Merriweather', '400;700;900'),
  'Playfair Display': serif('Playfair Display', '400;500;600;700;800;900'),
  'Lora': serif('Lora', '400;500;600;700'),
  'PT Serif': serif('PT Serif', '400;700'),
  'Libre Baskerville': serif('Libre Baskerville', '400;700'),
  'Crimson Text': serif('Crimson Text', '400;600;700'),
  'EB Garamond': serif('EB Garamond', '400;500;600;700;800'),
  'Source Serif 4': serif('Source Serif 4'),
  'Noto Serif': serif('Noto Serif', '400;500;600;700'),
  'Bitter': serif('Bitter', '400;500;600;700;800'),
  'DM Serif Display': serif('DM Serif Display', '400'),
  'Cormorant Garamond': serif('Cormorant Garamond', '400;500;600;700'),
  'Spectral': serif('Spectral', '400;500;600;700'),
  'Alegreya': serif('Alegreya', '400;500;600;700;800'),
  'Vollkorn': serif('Vollkorn', '400;500;600;700'),
  'Cardo': serif('Cardo', '400;700'),
  'Old Standard TT': serif('Old Standard TT', '400;700'),
  'Libre Caslon Text': serif('Libre Caslon Text', '400;700'),
  'Zilla Slab': serif('Zilla Slab', '400;500;600;700'),
  'IBM Plex Serif': serif('IBM Plex Serif', '400;500;600;700'),
  'Newsreader': serif('Newsreader'),
  'Fraunces': serif('Fraunces', '400;500;600;700;800;900'),
  'Young Serif': serif('Young Serif', '400'),
  'Instrument Serif': serif('Instrument Serif', '400'),
  'Brygada 1918': serif('Brygada 1918', '400;500;600;700'),

  // ── Display ──
  'Oswald': display('Oswald', '400;500;600;700'),
  'Bebas Neue': display('Bebas Neue', '400'),
  'Anton': display('Anton', '400'),
  'Righteous': display('Righteous', '400'),
  'Passion One': display('Passion One', '400;700;900'),
  'Abril Fatface': display('Abril Fatface', '400'),
  'Bungee': display('Bungee', '400'),
  'Permanent Marker': display('Permanent Marker', '400'),
  'Pacifico': display('Pacifico', '400'),
  'Fredoka': display('Fredoka', '400;500;600;700'),
  'Comfortaa': display('Comfortaa', '400;500;600;700'),
  'Audiowide': display('Audiowide', '400'),
  'Orbitron': display('Orbitron', '400;500;600;700;800;900'),
  'Major Mono Display': display('Major Mono Display', '400'),
  'Silkscreen': display('Silkscreen', '400;700'),
  'Press Start 2P': display('Press Start 2P', '400'),
  'Chivo': display('Chivo', '400;500;600;700;800;900'),
  'Big Shoulders Display': display('Big Shoulders Display', '400;500;600;700;800'),
  'Syne': display('Syne', '400;500;600;700;800'),
  'Alfa Slab One': display('Alfa Slab One', '400'),

  // ── Monospace ──
  'JetBrains Mono': mono('JetBrains Mono'),
  'Fira Code': mono('Fira Code', '400;500;600;700'),
  'Source Code Pro': mono('Source Code Pro', '400;500;600;700'),
  'IBM Plex Mono': mono('IBM Plex Mono', '400;500;600;700'),
  'Space Mono': mono('Space Mono', '400;700'),
  'Roboto Mono': mono('Roboto Mono', '400;500;600;700'),
  'Ubuntu Mono': mono('Ubuntu Mono', '400;700'),
  'Inconsolata': mono('Inconsolata', '400;500;600;700'),
  'Red Hat Mono': mono('Red Hat Mono', '400;500;600;700'),
  'DM Mono': mono('DM Mono', '400;500'),

  // ── Handwriting ──
  'Dancing Script': hand('Dancing Script', '400;500;600;700'),
  'Caveat': hand('Caveat', '400;500;600;700'),
  'Satisfy': hand('Satisfy', '400'),
  'Great Vibes': hand('Great Vibes', '400'),
  'Indie Flower': hand('Indie Flower', '400'),
  'Kalam': hand('Kalam', '400;700'),
  'Patrick Hand': hand('Patrick Hand', '400'),
  'Shadows Into Light': hand('Shadows Into Light', '400'),
  'Amatic SC': hand('Amatic SC', '400;700'),
  'Sacramento': hand('Sacramento', '400'),
};

/** All known font names for fast lookup */
const FONT_NAMES = Object.keys(GOOGLE_FONTS);

/**
 * Scan a CSS string for any referenced Google Font families.
 * Returns an array of matched font names from the GOOGLE_FONTS catalog.
 */
export function extractGoogleFonts(css: string): string[] {
  const found: string[] = [];
  for (const name of FONT_NAMES) {
    if (css.includes(name)) found.push(name);
  }
  return found;
}

/**
 * Build a single Google Fonts API v2 URL for the given font names.
 * Returns empty string if no fonts are provided.
 *
 * @example
 * buildGoogleFontsUrl(['Inter', 'Playfair Display'])
 * // → 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap'
 */
export function buildGoogleFontsUrl(fontNames: string[]): string {
  if (fontNames.length === 0) return '';
  const families = fontNames
    .map(name => {
      const def = GOOGLE_FONTS[name];
      if (!def) return '';
      return `family=${def.family}:wght@${def.weights}`;
    })
    .filter(Boolean);
  if (families.length === 0) return '';
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/**
 * Build a `<link>` tag string for the Google Fonts referenced in the given CSS.
 * Returns empty string if no Google Fonts are found.
 */
export function buildGoogleFontsLink(css: string): string {
  const fonts = extractGoogleFonts(css);
  if (fonts.length === 0) return '';
  const url = buildGoogleFontsUrl(fonts);
  return url ? `<link rel="stylesheet" href="${url}">` : '';
}
