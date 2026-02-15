import { Book } from "./library";
import { search as scholarlySearch } from "scholarly";

/**
 * This class handles the Scholar API
 * We use a hybrid approach to ensure stability in 2026.
 */

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
  const { title, year, authors, url, publication, description } = book;
  
  // Create a robust citation label: FirstAuthorYearShortTitle
  const firstAuthor = authors[0]?.split(" ").pop()?.toLowerCase() || "scholar";
  const shortTitle = title.split(" ").slice(0, 3).join("").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const label = `${firstAuthor}${year}${shortTitle}`;

  // Escape common LaTeX special characters
  const escapeLaTeX = (str: string = "") => 
    str.replace(/&/g, "\\&")
       .replace(/%/g, "\\%")
       .replace(/\$/g, "\\$")
       .replace(/#/g, "\\#")
       .replace(/_/g, "\\_")
       .replace(/\{/g, "\\{")
       .replace(/\}/g, "\\}");

  const authorList = authors.map(a => a.trim()).join(" and ");
  const entryType = publication ? "@article" : "@online";
  
  let bibtex = `${entryType}{${label},\n`;
  bibtex += `  author = {${escapeLaTeX(authorList)}},\n`;
  bibtex += `  title = {${escapeLaTeX(title)}},\n`;
  bibtex += `  year = {${year}},\n`;
  
  if (publication) {
    bibtex += `  journal = {${escapeLaTeX(publication)}},\n`;
  }
  
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
const semanticScholarSearch = async (query: string): Promise<Book[]> => {
  try {
    const response = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
        query
      )}&limit=10&fields=title,authors,year,url,citationCount,abstract,venue`
    );
    
    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    
    if (!response.ok) throw new Error("API request failed");
    
    const data = await response.json();
    
    return (data.data || []).map((paper: any) => ({
      title: paper.title,
      year: paper.year || new Date().getFullYear(),
      authors: paper.authors?.map((a: any) => a.name) || ["Unknown Author"],
      url: paper.url,
      numCitations: paper.citationCount,
      description: paper.abstract,
      publication: paper.venue
    }));
  } catch (error) {
    console.error("Semantic Scholar failed, falling back...", error);
    return [];
  }
};

/**
 * OpenAlex Search implementation (Free, High Rate Limits, No API Key needed)
 * This is a massive database of academic works and serves as a robust secondary.
 */
const openAlexSearch = async (query: string): Promise<Book[]> => {
  try {
    const response = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=10`
    );
    
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
const scholar = async (query: string): Promise<Book[]> => {
  if (!isNotEmpty(query)) return [];

  // 1. Try Semantic Scholar (Preferred for Rich Data)
  let results = await semanticScholarSearch(query);
  if (results.length > 0) return results;

  // 2. Try OpenAlex (Robust fallback, high rate limits)
  results = await openAlexSearch(query);
  if (results.length > 0) return results;

  // 3. Last resort: Original scraper (Note: frequently breaks due to Google changes)
  try {
    const fallbackResults: Book[] = await scholarlySearch(query);
    return fallbackResults || [];
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

export { scholar };
