import type { MklyKitVersions } from './kit';

// Default version when no core kit provides version info
export const MKLY_DEFAULT_VERSION = 1;

export interface VersionResult {
  version: number;
  error?: string;
}

export function resolveVersion(meta: Record<string, string>): VersionResult {
  const raw = meta.version;
  if (!raw) return { version: MKLY_DEFAULT_VERSION };
  const num = parseInt(raw, 10);
  if (isNaN(num)) return { version: MKLY_DEFAULT_VERSION, error: `Invalid version: "${raw}"` };
  return { version: num };
}

export function validateVersionAgainstKit(version: number, kitVersions?: MklyKitVersions): string | null {
  const supported = kitVersions?.supported ?? [MKLY_DEFAULT_VERSION];
  if (!supported.includes(version)) {
    return `Unsupported version: ${version}. Supported: ${supported.join(', ')}`;
  }
  return null;
}

export function getAvailableFeatures(version: number): string[] {
  const features: Record<number, string[]> = {
    1: [
      'core-blocks',
      'newsletter-kit',
      'style-v2',
      'inline-styles',
      'markdown-content',
      'container-blocks',
      'kit-system',
      'meta-block',
    ],
  };
  return features[version] ?? [];
}
