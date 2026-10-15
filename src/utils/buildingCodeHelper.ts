/**
 * Utility to calculate the next sequential building code automatically.
 * Examples:
 * - When GD-A exists -> suggests GD-B
 * - When GD-B exists -> suggests GD-C
 * - When GD-Z exists -> suggests GD-AA
 * - When GD-01 exists -> suggests GD-02
 * - When no buildings exist -> suggests GD-A
 */
export function getNextBuildingCode(buildings: { code?: string }[] = []): string {
  const codes = (buildings || [])
    .map(b => (b.code || '').trim().toUpperCase())
    .filter(Boolean);

  if (codes.length === 0) {
    return 'GD-A';
  }

  // Check if existing codes use numeric pattern like GD-01, GD-1, etc.
  let maxNumeric = 0;
  let hasNumeric = false;
  let padLength = 2;

  for (const c of codes) {
    const numMatch = c.match(/^GD-(\d+)$/i);
    if (numMatch) {
      hasNumeric = true;
      const num = parseInt(numMatch[1], 10);
      if (num > maxNumeric) {
        maxNumeric = num;
        padLength = Math.max(padLength, numMatch[1].length);
      }
    }
  }

  if (hasNumeric && maxNumeric > 0) {
    const nextNum = maxNumeric + 1;
    return `GD-${String(nextNum).padStart(padLength, '0')}`;
  }

  // Helper functions for base-26 letter conversion (A=1, B=2 ... Z=26, AA=27 ...)
  function lettersToNum(letters: string): number {
    let result = 0;
    for (let i = 0; i < letters.length; i++) {
      result = result * 26 + (letters.charCodeAt(i) - 64);
    }
    return result;
  }

  function numToLetters(num: number): string {
    let result = '';
    let n = num;
    while (n > 0) {
      const rem = (n - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result || 'A';
  }

  let maxAlpha = 0;
  let hasAlpha = false;

  for (const c of codes) {
    const alphaMatch = c.match(/^GD-([A-Z]+)$/i);
    if (alphaMatch) {
      hasAlpha = true;
      const val = lettersToNum(alphaMatch[1].toUpperCase());
      if (val > maxAlpha) {
        maxAlpha = val;
      }
    }
  }

  if (hasAlpha && maxAlpha > 0) {
    return `GD-${numToLetters(maxAlpha + 1)}`;
  }

  // Fallback: If no GD- pattern found, find first unused GD-A, GD-B, ...
  let idx = 1;
  while (idx <= 1000) {
    const candidate = `GD-${numToLetters(idx)}`;
    if (!codes.includes(candidate)) {
      return candidate;
    }
    idx++;
  }

  return `GD-${Date.now().toString().slice(-3)}`;
}
