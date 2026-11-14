// Forgiving search for Hindi titles: people type with or without spaces,
// punctuation, the nukta dot (फ़ / फ) or chandrabindu (ँ / ं).

export function searchKey(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .normalize("NFD") // split फ़ into फ + ़ so the dot can be removed
    .replace(/़/g, "") // nukta
    .replace(/ँ/g, "ं") // ँ → ं
    .replace(/[\s.,:;!?'"`’“”()[\]{}\-–—_/\\|…।॥]+/g, "")
    .normalize("NFC");
}

/** True if every word of the query appears in the text (in any order). */
export function matches(text: string, query: string): boolean {
  const hay = searchKey(text);
  return query
    .split(/\s+/)
    .map(searchKey)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
