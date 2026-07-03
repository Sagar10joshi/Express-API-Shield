/**
 * Matches a request path against an ignore list.
 * Supports exact paths ("/health"), trailing wildcard prefixes ("/admin/*"),
 * and simple RegExp objects for advanced cases.
 */
export function isIgnored(path: string, ignore: Array<string | RegExp> | undefined): boolean {
  if (!ignore || ignore.length === 0) return false;

  for (const rule of ignore) {
    if (rule instanceof RegExp) {
      if (rule.test(path)) return true;
      continue;
    }
    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -2);
      if (path === prefix || path.startsWith(`${prefix}/`)) return true;
      continue;
    }
    if (path === rule) return true;
  }
  return false;
}
