/**
 * Precompiled detection patterns for common injection/attack classes.
 *
 * IMPORTANT SCOPE NOTE: these are heuristic, defense-in-depth checks meant to
 * catch obviously malicious payloads and log/block them early. They are NOT
 * a substitute for parameterized queries, an ORM, output encoding, a real
 * WAF, or framework-level protections (e.g. Mongoose's own operator
 * sanitization). Document this loudly in the README so users don't treat
 * this as their only line of defense.
 *
 * Patterns are intentionally conservative to minimize false positives on
 * legitimate content (e.g. a bio field containing the word "constructor").
 * Tune `checks` / `action: 'log'` per-app rather than assuming block-all.
 */

export type PatternCategory =
  | 'sql'
  | 'nosql'
  | 'xss'
  | 'commandInjection'
  | 'pathTraversal'
  | 'templateInjection'
  | 'prototypePollution';

export interface CompiledPattern {
  category: PatternCategory;
  regex: RegExp;
  label: string;
}

// All regexes are non-backtracking-friendly (no nested quantifiers) to avoid ReDoS
// via user input, since this runs on every request body/query/header.
export const PATTERNS: CompiledPattern[] = [
  // --- SQL Injection ---
  { category: 'sql', label: 'boolean tautology', regex: /'\s*or\s+\d+\s*=\s*\d+/i },
  { category: 'sql', label: 'UNION SELECT', regex: /\bunion\b\s+\bselect\b/i },
  { category: 'sql', label: 'DROP/ALTER/TRUNCATE TABLE', regex: /\b(drop|truncate|alter)\s+table\b/i },
  { category: 'sql', label: 'SQL comment terminator', regex: /(--|#)\s*$/ },
  { category: 'sql', label: 'stacked query', regex: /;\s*(select|insert|update|delete|drop)\b/i },

  // --- NoSQL Injection (Mongo-style operators) ---
  { category: 'nosql', label: '$where operator', regex: /\$where\b/i },
  { category: 'nosql', label: '$gt/$lt/$ne/$gte/$lte operator', regex: /\$(gt|lt|gte|lte|ne)\b/i },
  { category: 'nosql', label: '$regex operator', regex: /\$regex\b/i },

  // --- XSS ---
  { category: 'xss', label: 'script tag', regex: /<script[\s>]/i },
  { category: 'xss', label: 'javascript: URI', regex: /javascript:/i },
  { category: 'xss', label: 'inline event handler', regex: /\bon(error|load|click|mouseover)\s*=/i },

  // --- Command Injection ---
  { category: 'commandInjection', label: 'shell chaining', regex: /(\|\||&&|;\s*\w+\s*(&&|;|\|))/ },
  { category: 'commandInjection', label: 'backtick execution', regex: /`[^`]+`/ },

  // --- Path Traversal ---
  { category: 'pathTraversal', label: 'directory traversal', regex: /(\.\.\/|\.\.\\)/ },

  // --- Template Injection ---
  { category: 'templateInjection', label: 'double-brace template', regex: /\{\{.*\}\}/ },
  { category: 'templateInjection', label: 'JS template literal injection', regex: /\$\{.*\}/ },
  { category: 'templateInjection', label: 'EJS tag', regex: /<%=?.*%>/ },

  // --- Prototype Pollution ---
  { category: 'prototypePollution', label: '__proto__ key', regex: /__proto__/ },
  { category: 'prototypePollution', label: 'constructor.prototype key', regex: /\bconstructor\s*\.\s*prototype\b/ },
];

export function patternsForCategories(categories: PatternCategory[]): CompiledPattern[] {
  const set = new Set(categories);
  return PATTERNS.filter((p) => set.has(p.category));
}
