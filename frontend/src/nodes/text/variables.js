// Variable parsing for the Text node.
//
// A "variable" is a valid JavaScript identifier wrapped in double curly braces,
// e.g. {{ input }}. The identifier rules below intentionally:
//   - allow surrounding whitespace:      {{ name }}      -> name
//   - reject hyphens / invalid starts:   {{input-name}}  -> (none)
//                                        {{1bad}}        -> (none)
//   - dedupe repeated variables:         {{a}} {{a}}     -> [a]
// The pattern matches a leading letter/_/$ followed by word chars/$, which is
// the canonical JS identifier shape.
const VARIABLE_PATTERN = /\{\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}\}/g;

/**
 * Extract the unique, in-order list of variable names from a piece of text.
 * @param {string} text
 * @returns {string[]}
 */
export function parseVariables(text) {
  if (!text) return [];
  const seen = new Set();
  const result = [];
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}
