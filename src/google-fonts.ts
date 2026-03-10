/**
 * Google Fonts catalog — maps font family names to their API loading parameters.
 * Used to dynamically load only the fonts actually referenced in a document.
 *
 * 300+ fonts across 5 categories.
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

const sans = (family: string, weights = '400;500;600;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'), weights, fallback: 'sans-serif', category: 'sans-serif',
});

const serif = (family: string, weights = '400;500;600;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'), weights, fallback: 'serif', category: 'serif',
});

const display = (family: string, weights = '400;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'), weights, fallback: 'sans-serif', category: 'display',
});

const mono = (family: string, weights = '400;500;600;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'), weights, fallback: 'monospace', category: 'monospace',
});

const hand = (family: string, weights = '400;700'): GoogleFontDef => ({
  family: family.replace(/ /g, '+'), weights, fallback: 'cursive', category: 'handwriting',
});

/**
 * Complete catalog of supported Google Fonts.
 * Key = exact CSS font-family name (the name users write in CSS).
 */
export const GOOGLE_FONTS: Record<string, GoogleFontDef> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SANS-SERIF (~100)
  // ═══════════════════════════════════════════════════════════════════════════
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
  'Nunito Sans': sans('Nunito Sans', '400;500;600;700;800'),
  'IBM Plex Sans': sans('IBM Plex Sans', '400;500;600;700'),
  'PT Sans': sans('PT Sans', '400;700'),
  'Roboto Condensed': sans('Roboto Condensed', '400;500;700'),
  'Roboto Flex': sans('Roboto Flex', '400;500;600;700'),
  'Ubuntu': sans('Ubuntu', '400;500;700'),
  'Noto Sans Display': sans('Noto Sans Display', '400;500;600;700'),
  'Titillium Web': sans('Titillium Web', '400;600;700'),
  'Fira Sans': sans('Fira Sans', '400;500;600;700'),
  'Libre Franklin': sans('Libre Franklin', '400;500;600;700'),
  'Oxygen': sans('Oxygen', '400;700'),
  'Overpass': sans('Overpass', '400;500;600;700'),
  'Maven Pro': sans('Maven Pro', '400;500;600;700'),
  'Asap': sans('Asap', '400;500;600;700'),
  'Catamaran': sans('Catamaran', '400;500;600;700;800'),
  'Heebo': sans('Heebo', '400;500;600;700;800'),
  'Assistant': sans('Assistant', '400;500;600;700'),
  'Varela Round': sans('Varela Round', '400'),
  'Abel': sans('Abel', '400'),
  'Questrial': sans('Questrial', '400'),
  'Signika': sans('Signika', '400;500;600;700'),
  'Tenor Sans': sans('Tenor Sans', '400'),
  'Encode Sans': sans('Encode Sans', '400;500;600;700'),
  'Jost': sans('Jost', '400;500;600;700'),
  'Red Hat Text': sans('Red Hat Text', '400;500;600;700'),
  'Atkinson Hyperlegible': sans('Atkinson Hyperlegible', '400;700'),
  'Schibsted Grotesk': sans('Schibsted Grotesk', '400;500;600;700'),
  'Wix Madefor Display': sans('Wix Madefor Display', '400;500;600;700;800'),
  'Be Vietnam Pro': sans('Be Vietnam Pro', '400;500;600;700'),
  'Onest': sans('Onest', '400;500;600;700'),
  'Instrument Sans': sans('Instrument Sans', '400;500;600;700'),
  'Geologica': sans('Geologica', '400;500;600;700'),
  'Hanken Grotesk': sans('Hanken Grotesk', '400;500;600;700'),
  'General Sans': sans('General Sans', '400;500;600;700'),
  'Switzer': sans('Switzer', '400;500;600;700'),
  'Satoshi': sans('Satoshi', '400;500;700'),
  'Bricolage Grotesque': sans('Bricolage Grotesque', '400;500;600;700;800'),
  'Golos Text': sans('Golos Text', '400;500;600;700'),
  'Readex Pro': sans('Readex Pro', '400;500;600;700'),
  'Lexend Deca': sans('Lexend Deca', '400;500;600;700'),
  'Hind': sans('Hind', '400;500;600;700'),
  'Kanit': sans('Kanit', '400;500;600;700'),
  'Prompt': sans('Prompt', '400;500;600;700'),
  'Arimo': sans('Arimo', '400;500;600;700'),
  'Dosis': sans('Dosis', '400;500;600;700'),
  'Exo': sans('Exo', '400;500;600;700'),
  'Mada': sans('Mada', '400;500;600;700'),
  'Istok Web': sans('Istok Web', '400;700'),
  'Nanum Gothic': sans('Nanum Gothic', '400;700;800'),
  'Yantramanav': sans('Yantramanav', '400;500;700'),
  'Barlow Condensed': sans('Barlow Condensed', '400;500;600;700'),
  'Barlow Semi Condensed': sans('Barlow Semi Condensed', '400;500;600;700'),
  'Signika Negative': sans('Signika Negative', '400;500;600;700'),
  'Chivo Mono': sans('Chivo Mono', '400;500;600;700'),
  'Epilogue': sans('Epilogue', '400;500;600;700;800'),
  'Pathway Extreme': sans('Pathway Extreme', '400;500;600;700'),
  'Gabarito': sans('Gabarito', '400;500;600;700'),
  'Afacad': sans('Afacad', '400;500;600;700'),
  'Funnel Sans': sans('Funnel Sans', '400;500;600;700'),
  'Inclusive Sans': sans('Inclusive Sans', '400'),
  'Recursive': sans('Recursive', '400;500;600;700'),
  'Darker Grotesque': sans('Darker Grotesque', '400;500;600;700;800'),

  // ═══════════════════════════════════════════════════════════════════════════
  // SERIF (~70)
  // ═══════════════════════════════════════════════════════════════════════════
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
  'Roboto Slab': serif('Roboto Slab', '400;500;600;700'),
  'Noto Serif Display': serif('Noto Serif Display', '400;500;600;700'),
  'Crimson Pro': serif('Crimson Pro', '400;500;600;700'),
  'Gelasio': serif('Gelasio', '400;500;600;700'),
  'Cormorant': serif('Cormorant', '400;500;600;700'),
  'Cormorant Infant': serif('Cormorant Infant', '400;500;600;700'),
  'Sorts Mill Goudy': serif('Sorts Mill Goudy', '400'),
  'Gilda Display': serif('Gilda Display', '400'),
  'Mate': serif('Mate', '400'),
  'Rokkitt': serif('Rokkitt', '400;500;600;700'),
  'Faustina': serif('Faustina', '400;500;600;700'),
  'Taviraj': serif('Taviraj', '400;500;600;700'),
  'Martel': serif('Martel', '400;600;700;800;900'),
  'Frank Ruhl Libre': serif('Frank Ruhl Libre', '400;500;600;700'),
  'Literata': serif('Literata', '400;500;600;700'),
  'Domine': serif('Domine', '400;500;600;700'),
  'Arapey': serif('Arapey', '400'),
  'Bodoni Moda': serif('Bodoni Moda', '400;500;600;700;800;900'),
  'Unna': serif('Unna', '400;700'),
  'Scope One': serif('Scope One', '400'),
  'Libre Caslon Display': serif('Libre Caslon Display', '400'),
  'Cormorant Upright': serif('Cormorant Upright', '400;500;600;700'),
  'Coustard': serif('Coustard', '400;900'),
  'Eczar': serif('Eczar', '400;500;600;700;800'),
  'Amiri': serif('Amiri', '400;700'),
  'Pridi': serif('Pridi', '400;500;600;700'),
  'Antic Slab': serif('Antic Slab', '400'),
  'Brawler': serif('Brawler', '400;700'),
  'Quando': serif('Quando', '400'),
  'Neuton': serif('Neuton', '400;700;800'),
  'Radley': serif('Radley', '400'),
  'Lustria': serif('Lustria', '400'),
  'Petrona': serif('Petrona', '400;500;600;700'),
  'Prata': serif('Prata', '400'),
  'Playfair': serif('Playfair', '400;500;600;700;800'),
  'Rufina': serif('Rufina', '400;700'),
  'Bellefair': serif('Bellefair', '400'),
  'Sedan': serif('Sedan', '400'),
  'DM Serif Text': serif('DM Serif Text', '400'),
  'Linden Hill': serif('Linden Hill', '400'),
  'Labrada': serif('Labrada', '400;500;600;700'),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISPLAY (~80)
  // ═══════════════════════════════════════════════════════════════════════════
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
  'Lobster': display('Lobster', '400'),
  'Lobster Two': display('Lobster Two', '400;700'),
  'Lilita One': display('Lilita One', '400'),
  'Russo One': display('Russo One', '400'),
  'Baloo 2': display('Baloo 2', '400;500;600;700;800'),
  'Bungee Shade': display('Bungee Shade', '400'),
  'Bungee Inline': display('Bungee Inline', '400'),
  'Bungee Outline': display('Bungee Outline', '400'),
  'Titan One': display('Titan One', '400'),
  'Black Ops One': display('Black Ops One', '400'),
  'Rubik Mono One': display('Rubik Mono One', '400'),
  'Rubik Burned': display('Rubik Burned', '400'),
  'Rubik Vinyl': display('Rubik Vinyl', '400'),
  'Rubik Glitch': display('Rubik Glitch', '400'),
  'Rubik Wet Paint': display('Rubik Wet Paint', '400'),
  'Rubik Dirt': display('Rubik Dirt', '400'),
  'Rubik Distressed': display('Rubik Distressed', '400'),
  'Rubik Maze': display('Rubik Maze', '400'),
  'Rubik Microbe': display('Rubik Microbe', '400'),
  'Rubik Puddles': display('Rubik Puddles', '400'),
  'Teko': display('Teko', '400;500;600;700'),
  'Patua One': display('Patua One', '400'),
  'Secular One': display('Secular One', '400'),
  'Concert One': display('Concert One', '400'),
  'Luckiest Guy': display('Luckiest Guy', '400'),
  'Bangers': display('Bangers', '400'),
  'Boogaloo': display('Boogaloo', '400'),
  'Fredericka the Great': display('Fredericka the Great', '400'),
  'Carter One': display('Carter One', '400'),
  'Squada One': display('Squada One', '400'),
  'Fugaz One': display('Fugaz One', '400'),
  'Acme': display('Acme', '400'),
  'Archivo Black': display('Archivo Black', '400'),
  'Bowlby One SC': display('Bowlby One SC', '400'),
  'Ultra': display('Ultra', '400'),
  'Monoton': display('Monoton', '400'),
  'Faster One': display('Faster One', '400'),
  'Shrikhand': display('Shrikhand', '400'),
  'Limelight': display('Limelight', '400'),
  'Graduate': display('Graduate', '400'),
  'Megrim': display('Megrim', '400'),
  'Fascinate': display('Fascinate', '400'),
  'Fascinate Inline': display('Fascinate Inline', '400'),
  'Poller One': display('Poller One', '400'),
  'Spicy Rice': display('Spicy Rice', '400'),
  'Viga': display('Viga', '400'),
  'Staatliches': display('Staatliches', '400'),
  'Bungee Spice': display('Bungee Spice', '400'),
  'Climate Crisis': display('Climate Crisis', '400'),
  'Nabla': display('Nabla', '400'),
  'Honk': display('Honk', '400'),
  'Pixelify Sans': display('Pixelify Sans', '400;500;600;700'),
  'Gloock': display('Gloock', '400'),
  'Unbounded': display('Unbounded', '400;500;600;700;800'),
  'Big Shoulders Text': display('Big Shoulders Text', '400;500;600;700;800'),
  'Big Shoulders Stencil Display': display('Big Shoulders Stencil Display', '400;500;600;700;800'),
  'Big Shoulders Inline Display': display('Big Shoulders Inline Display', '400;500;600;700;800'),
  'Rampart One': display('Rampart One', '400'),

  // ═══════════════════════════════════════════════════════════════════════════
  // MONOSPACE (~25)
  // ═══════════════════════════════════════════════════════════════════════════
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
  'Fira Mono': mono('Fira Mono', '400;500;700'),
  'PT Mono': mono('PT Mono', '400'),
  'Overpass Mono': mono('Overpass Mono', '400;500;600;700'),
  'Azeret Mono': mono('Azeret Mono', '400;500;600;700'),
  'Martian Mono': mono('Martian Mono', '400;500;600;700'),
  'Noto Sans Mono': mono('Noto Sans Mono', '400;500;600;700'),
  'Anonymous Pro': mono('Anonymous Pro', '400;700'),
  'Courier Prime': mono('Courier Prime', '400;700'),
  'Cutive Mono': mono('Cutive Mono', '400'),
  'Share Tech Mono': mono('Share Tech Mono', '400'),
  'Victor Mono': mono('Victor Mono', '400;500;600;700'),
  'Xanh Mono': mono('Xanh Mono', '400'),
  'Syne Mono': mono('Syne Mono', '400'),
  'B612 Mono': mono('B612 Mono', '400;700'),

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDWRITING (~40)
  // ═══════════════════════════════════════════════════════════════════════════
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
  'Allura': hand('Allura', '400'),
  'Cookie': hand('Cookie', '400'),
  'Tangerine': hand('Tangerine', '400;700'),
  'Alex Brush': hand('Alex Brush', '400'),
  'Architects Daughter': hand('Architects Daughter', '400'),
  'Homemade Apple': hand('Homemade Apple', '400'),
  'Courgette': hand('Courgette', '400'),
  'Kaushan Script': hand('Kaushan Script', '400'),
  'Yellowtail': hand('Yellowtail', '400'),
  'Mr Dafoe': hand('Mr Dafoe', '400'),
  'Rock Salt': hand('Rock Salt', '400'),
  'Reenie Beanie': hand('Reenie Beanie', '400'),
  'Nothing You Could Do': hand('Nothing You Could Do', '400'),
  'Covered By Your Grace': hand('Covered By Your Grace', '400'),
  'Neucha': hand('Neucha', '400'),
  'Handlee': hand('Handlee', '400'),
  'Sriracha': hand('Sriracha', '400'),
  'Gloria Hallelujah': hand('Gloria Hallelujah', '400'),
  'Pangolin': hand('Pangolin', '400'),
  'Itim': hand('Itim', '400'),
  'Sue Ellen Francisco': hand('Sue Ellen Francisco', '400'),
  'Gochi Hand': hand('Gochi Hand', '400'),
  'Dekko': hand('Dekko', '400'),
  'Merienda': hand('Merienda', '400;500;600;700;800'),
  'Grandstander': hand('Grandstander', '400;500;600;700;800'),
  'Grape Nuts': hand('Grape Nuts', '400'),
  'Edu VIC WA NT Beginner': hand('Edu VIC WA NT Beginner', '400;500;600;700'),
  'Playpen Sans': hand('Playpen Sans', '400;500;600;700;800'),
  'Comforter': hand('Comforter', '400'),
  'Licorice': hand('Licorice', '400'),
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
