import { Book } from "./library";
import { search as scholarlySearch } from "scholarly";
import { doc, getDoc } from "firebase/firestore";
import { firestore, auth } from "./firebase";

/**
 * This class handles the Scholar API
 * We use a hybrid approach to ensure stability in 2026.
 */

export interface SearchOptions {
  year?: string;
  minCitations?: number;
  venue?: string;
  sort?: string;
}

const isNotEmpty = (query: string): boolean => {
  return query.trim() !== "";
};

export const toList = (authors: string[]): string => {
  return authors.join(", ");
};

/**
 * This method parses a book into a LaTeX style citation
 */
export const cite = (book: Book): string => {
  const { title, year, authors, url, publication, journal, volume, number, pages, doi, description, bibtexKey } = book;
  
  // Use existing key if available, otherwise generate one: FirstAuthorYearShortTitle
  let label = bibtexKey;
  if (!label) {
    const firstAuthor = authors[0]?.split(" ").pop()?.toLowerCase() || "scholar";
    const shortTitle = title.split(" ").slice(0, 3).join("").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    label = `${firstAuthor}${year}${shortTitle}`;
  }

  // Escape common LaTeX special characters
  const escapeLaTeX = (str: string = "") => 
    String(str).replace(/&/g, "\\&")
       .replace(/%/g, "\\%")
       .replace(/\$/g, "\\$")
       .replace(/#/g, "\\#")
       .replace(/_/g, "\\_")
       .replace(/\{/g, "\\{")
       .replace(/\}/g, "\\}");

  const authorList = authors.map(a => a.trim()).join(" and ");
  const entryType = (publication || journal) ? "@article" : "@online";
  
  let bibtex = `${entryType}{${label},\n`;
  bibtex += `  author = {${escapeLaTeX(authorList)}},\n`;
  bibtex += `  title = {${escapeLaTeX(title)}},\n`;
  bibtex += `  year = {${year}},\n`;
  
  const journalName = journal || publication;
  if (journalName) {
    bibtex += `  journal = {${escapeLaTeX(journalName)}},\n`;
  }
  
  if (volume) bibtex += `  volume = {${volume}},\n`;
  if (number) bibtex += `  number = {${number}},\n`;
  if (pages) bibtex += `  pages = {${pages}},\n`;
  if (doi) bibtex += `  doi = {${doi}},\n`;

  if (url) {
    bibtex += `  url = {${url}},\n`;
    bibtex += `  urldate = {${new Date().toISOString().split('T')[0]}},\n`;
  }

  if (description) {
    bibtex += `  abstract = {${escapeLaTeX(description)}}\n`;
  }
  
  bibtex += `}`;
  
  return bibtex;
};

/**
 * Modern Search implementation using Semantic Scholar API (Stable & Free)
 * This avoids the 'Error 409' blocks common with Google Scholar scraping.
 */
const semanticScholarSearch = async (query: string, options: SearchOptions = {}): Promise<Book[]> => {
  try {
    const headers: Record<string, string> = {};
    
    if (auth.currentUser) {
      try {
        const settingsRef = doc(firestore, `users/${auth.currentUser.uid}/settings/preferences`);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().ssApiKey) {
          headers["x-api-key"] = settingsSnap.data().ssApiKey;
        }
      } catch (e) { /* silent fail */ }
    }

    let url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=title,authors,year,url,citationCount,abstract,venue,publicationVenue,journal,externalIds,s2FieldsOfStudy`;
    
    if (options.year) {
      url += `&year=${encodeURIComponent(options.year)}`;
    }
    if (options.venue) {
      url += `&venue=${encodeURIComponent(options.venue)}`;
    }
    if (options.sort) {
      url += `&sort=${encodeURIComponent(options.sort)}`;
    }

    const response = await fetch(url, { headers });
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    
    if (!response.ok) throw new Error("API request failed");
    
    const data = await response.json();
    
    let results = (data.data || []).map((paper: any) => ({
      title: paper.title,
      year: paper.year || new Date().getFullYear(),
      authors: paper.authors?.map((a: any) => a.name) || ["Unknown Author"],
      url: paper.url,
      numCitations: paper.citationCount || 0,
      description: paper.abstract,
      publication: paper.venue || paper.publicationVenue?.name || paper.journal?.name,
      journal: paper.journal?.name || paper.publicationVenue?.name,
      volume: paper.journal?.volume,
      pages: paper.journal?.pages,
      doi: paper.externalIds?.DOI,
      keywords: paper.s2FieldsOfStudy?.map((f: any) => f.category) || []
    }));

    if (options.minCitations) {
      results = results.filter((r: Book) => (r.numCitations || 0) >= (options.minCitations || 0));
    }

    return results;
  } catch (error) {
    if ((error as Error).message === "RATE_LIMIT") throw error;
    console.error("Semantic Scholar failed, falling back...", error);
    return [];
  }
};

/**
 * OpenAlex Search implementation (Free, High Rate Limits, No API Key needed)
 * This is a massive database of academic works and serves as a robust secondary.
 */
const openAlexSearch = async (query: string, options: SearchOptions = {}): Promise<Book[]> => {
  try {
    let url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10`;
    
    const filters = [];
    if (options.year) {
      // OpenAlex year filter can be a single year or range like 2020-2022
      if (options.year.includes("-")) {
        const [start, end] = options.year.split("-");
        if (start) filters.push(`publication_year:>${parseInt(start) - 1}`);
        if (end) filters.push(`publication_year:<${parseInt(end) + 1}`);
      } else {
        filters.push(`publication_year:${options.year}`);
      }
    }
    if (options.minCitations) {
      filters.push(`cited_by_count:>${options.minCitations - 1}`);
    }
    
    if (filters.length > 0) {
      url += `&filter=${encodeURIComponent(filters.join(","))}`;
    }
    
    if (options.sort) {
      // Map Semantic Scholar sort names to OpenAlex sort names if necessary
      let openAlexSort = options.sort;
      if (options.sort === "citationCount:desc") openAlexSort = "cited_by_count:desc";
      if (options.sort === "year:desc") openAlexSort = "publication_year:desc";
      
      url += `&sort=${encodeURIComponent(openAlexSort)}`;
    }

    const response = await fetch(url);
    
    if (!response.ok) throw new Error("OpenAlex request failed");
    
    const data = await response.json();
    
    return (data.results || []).map((work: any) => ({
      title: work.title || "Untitled Work",
      year: work.publication_year || new Date().getFullYear(),
      authors: work.authorships?.map((a: any) => a.author.display_name) || ["Unknown Author"],
      url: work.doi || work.primary_location?.landing_page_url || "",
      numCitations: work.cited_by_count || 0,
      description: work.abstract_inverted_index ? "Abstract available in library view." : "No description provided.",
      publication: work.primary_location?.source?.display_name || ""
    }));
  } catch (error) {
    console.error("OpenAlex search failed", error);
    return [];
  }
};

/**
 * Main search function with resilient multi-provider fallback logic
 */
const scholar = async (query: string, options: SearchOptions = {}): Promise<Book[]> => {
  if (!isNotEmpty(query)) return [];

  // 1. Try Semantic Scholar (Preferred for Rich Data)
  let results = await semanticScholarSearch(query, options);
  if (results.length > 0) return results;

  // 2. Try OpenAlex (Robust fallback, high rate limits)
  results = await openAlexSearch(query, options);
  if (results.length > 0) return results;

  // 3. Last resort: Original scraper (Note: frequently breaks due to Google changes)
  try {
    const fallbackResults: any = await scholarlySearch(query);
    return (fallbackResults || []) as Book[];
  } catch (error) {
    console.error("All academic providers exhausted", error);
    return [];
  }
};

/**
 * Targeted search to find a URL for a specific paper.
 */
export const findPaperUrl = async (title: string): Promise<string | null> => {
  try {
    const results = await semanticScholarSearch(title);
    // Find result with exact title match (case insensitive)
    const match = results.find(r => r.title.toLowerCase() === title.toLowerCase());
    return match?.url || results[0]?.url || null;
  } catch (error) {
    return null;
  }
};

/**
 * Fetches paper recommendations based on a list of seed titles.
 * Uses Semantic Scholar's recommendations API.
 */
export const getRecommendations = async (seedTitles: string[]): Promise<Book[]> => {
  try {
    const headers: Record<string, string> = {};
    if (auth.currentUser) {
      try {
        const settingsRef = doc(firestore, `users/${auth.currentUser.uid}/settings/preferences`);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().ssApiKey) {
          headers["x-api-key"] = settingsSnap.data().ssApiKey;
        }
      } catch (e) { /* silent fail */ }
    }

    // 1. Get Semantic Scholar IDs for the seed titles
    const paperIds: string[] = [];
    for (const title of seedTitles.slice(0, 3)) { // Limit to 3 seeds to avoid rate limits
      const searchUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&limit=1&fields=paperId`;
      const searchRes = await fetch(searchUrl, { headers });
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.data && data.data.length > 0) {
          paperIds.push(data.data[0].paperId);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Respect rate limits
    }

    if (paperIds.length === 0) return [];

    // 2. Fetch recommendations for the first valid ID
    // Semantic scholar allows positive/negative IDs but standard endpoint is /paper/{id}/recommendations
    const recUrl = `https://api.semanticscholar.org/graph/v1/paper/${paperIds[0]}/recommendations?limit=10&fields=title,authors,year,url,citationCount,abstract,venue,publicationVenue,journal,externalIds`;
    
    const response = await fetch(recUrl, { headers });
    if (!response.ok) throw new Error("Recommendations request failed");
    
    const data = await response.json();
    
    return (data.recommendedPapers || []).map((paper: any) => ({
      title: paper.title,
      year: paper.year || new Date().getFullYear(),
      authors: paper.authors?.map((a: any) => a.name) || ["Unknown Author"],
      url: paper.url,
      numCitations: paper.citationCount || 0,
      description: paper.abstract,
      publication: paper.venue || paper.publicationVenue?.name || paper.journal?.name,
      journal: paper.journal?.name || paper.publicationVenue?.name,
      volume: paper.journal?.volume,
      pages: paper.journal?.pages,
      doi: paper.externalIds?.DOI
    }));
  } catch (error) {
    console.error("Failed to get recommendations", error);
    return [];
  }
};

/**
 * Fetches paper metadata directly using a DOI or Semantic Scholar ID.
 */
export const fetchMetadataByDoi = async (doi: string): Promise<Partial<Book> | null> => {
  try {
    const headers: Record<string, string> = {};
    if (auth.currentUser) {
      try {
        const settingsRef = doc(firestore, `users/${auth.currentUser.uid}/settings/preferences`);
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().ssApiKey) {
          headers["x-api-key"] = settingsSnap.data().ssApiKey;
        }
      } catch (e) { /* silent fail */ }
    }

    const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${doi}?fields=title,authors,year,url,citationCount,abstract,venue,publicationVenue,journal,externalIds,s2FieldsOfStudy`;
    const response = await fetch(url, { headers });
    
    if (response.status === 429) throw new Error("RATE_LIMIT");
    if (!response.ok) return null;
    
    const paper = await response.json();
    return {
      title: paper.title,
      year: paper.year,
      authors: paper.authors?.map((a: any) => a.name) || [],
      url: paper.url,
      numCitations: paper.citationCount,
      description: paper.abstract,
      publication: paper.venue || paper.publicationVenue?.name || paper.journal?.name,
      journal: paper.journal?.name || paper.publicationVenue?.name,
      volume: paper.journal?.volume,
      pages: paper.journal?.pages,
      doi: paper.externalIds?.DOI,
      keywords: paper.s2FieldsOfStudy?.map((f: any) => f.category) || []
    };
  } catch (error) {
    if ((error as Error).message === "RATE_LIMIT") throw error;
    return null;
  }
};

export { scholar };
