/** True when every whitespace-separated term of `query` occurs in `haystack` (case-insensitive). */
export function matchesAllTerms(haystack: string, query: string): boolean {
  const normalizedHaystack = haystack.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => normalizedHaystack.includes(term));
}
