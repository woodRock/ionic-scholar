import { Book } from "./library";
import { cite } from "./scholar";

/**
 * A highly robust BibTeX parser designed to handle real-world academic data.
 */
export const parseBibTeX = (bibtex: string): { books: Book[], totalFound: number } => {
  const books: Book[] = [];
  
  // 1. Identify all entries starting with @
  // Improved regex: matches @Type{Key followed by either a comma or whitespace/body
  const entryStartRegex = /@([a-zA-Z0-9\/\.\-_]+)\s*\{\s*([a-zA-Z0-9\/\.\-_:]+)\s*[, \n]/g;
  let entryMatches = [];
  let match;
  while ((match = entryStartRegex.exec(bibtex)) !== null) {
    entryMatches.push({
      type: match[1].trim(),
      key: match[2].trim(),
      start: match.index,
      bodyStart: match.index + match[0].length - 1 // Start scanning from the character after the Key
    });
  }

  const totalFound = entryMatches.length;

  for (let i = 0; i < entryMatches.length; i++) {
    const current = entryMatches[i];
    
    // Find the end of the entry by counting braces
    let braceCount = 1;
    let endIdx = -1;
    const searchArea = bibtex.substring(current.bodyStart);
    
    for (let j = 0; j < searchArea.length; j++) {
      if (searchArea[j] === '{') braceCount++;
      if (searchArea[j] === '}') braceCount--;
      if (braceCount === 0) {
        endIdx = current.bodyStart + j;
        break;
      }
    }

    if (endIdx === -1) continue; // Malformed entry

    const entryContent = bibtex.substring(current.bodyStart, endIdx);
    
    /**
     * Extracts a field value using a more precise matching strategy.
     * Uses word boundaries to avoid matching substrings (e.g., 'author' vs 'isSauthor').
     */
    const extractField = (fieldNames: string[]): string => {
      for (const name of fieldNames) {
        // Match name = {val} or name = "val" or name = val
        // The regex looks for the name at the start of a line or after a comma/whitespace
        const fieldRegex = new RegExp(`(?:^|[,\\s])(${name})\\s*=\\s*`, 'i');
        const fieldMatch = entryContent.match(fieldRegex);
        if (!fieldMatch) continue;

        const valStart = fieldMatch.index! + fieldMatch[0].length;
        const valArea = entryContent.substring(valStart).trim();
        let value = "";

        if (valArea[0] === '{' || valArea[0] === '"') {
          const closer = valArea[0] === '{' ? '}' : '"';
          let localBrace = 0;
          for (let k = 0; k < valArea.length; k++) {
            if (valArea[k] === '{') localBrace++;
            if (valArea[k] === '}') localBrace--;
            if (localBrace === 0 && valArea[k] === closer && k > 0) {
              value = valArea.substring(1, k);
              break;
            }
          }
        } else {
          // Unquoted value (often numeric or single word)
          const commaIdx = valArea.indexOf(',');
          const braceIdx = valArea.indexOf('}');
          let splitIdx = -1;
          if (commaIdx !== -1 && braceIdx !== -1) splitIdx = Math.min(commaIdx, braceIdx);
          else splitIdx = Math.max(commaIdx, braceIdx);
          
          value = splitIdx === -1 ? valArea : valArea.substring(0, splitIdx);
        }

        if (value) {
          return value
            .replace(/\\url\{([^}]+)\}/g, '$1') // Strip \url{...}
            .replace(/[\{\}]/g, '') // Remove LaTeX grouping braces
            .replace(/\\"/g, '"')   // Unescape quotes
            .replace(/\\'/g, '')    // Simple fix for accents
            .replace(/\\\//g, '/')  // Unescape slashes
            .replace(/\s+/g, ' ')   // Normalize whitespace
            .trim();
        }
      }
      return "";
    };

    const title = extractField(['title']);
    const yearStr = extractField(['year']);
    // Handle corrupted 'isSauthor' in user dump
    const authorStr = extractField(['author', 'authors', 'isSauthor']);
    const url = extractField(['url', 'howpublished', 'doi']);
    const journal = extractField(['journal', 'booktitle', 'series', 'publisher', 'institution']);
    const abstract = extractField(['abstract', 'description', 'note']);
    const volume = extractField(['volume']);
    const number = extractField(['number', 'issue']);
    const pages = extractField(['pages']);
    const doiField = extractField(['doi']);

    if (title || authorStr) {
      books.push({
        title: title || "Untitled (" + current.key + ")",
        year: parseInt(yearStr) || new Date().getFullYear(),
        authors: authorStr ? authorStr.split(/\s+and\s+/i).map(a => a.trim()) : ["Unknown Author"],
        url: url.includes('http') ? url : (url ? `https://doi.org/${url}` : ""),
        publication: journal,
        journal: journal,
        description: abstract,
        volume: volume,
        number: number,
        pages: pages,
        bibtexKey: current.key,
        doi: doiField || (url.includes('doi.org') ? url.split('doi.org/').pop() : "")
      });
    }
  }
  
  return { books, totalFound };
};

/**
 * Exports the entire library to a .bib file format.
 */
export const exportToBibTeX = (library: Book[]) => {
  const content = library.map(book => cite(book)).join('\n\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'refs.bib';
  a.click();
  window.URL.revokeObjectURL(url);
};
