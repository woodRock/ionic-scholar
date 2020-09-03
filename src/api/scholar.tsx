import { Book } from "./library";
import { search } from "scholarly";

/**
 * This class handles the Scholar API
 * We isolate the business logic here
 */

/**
 * The scholar API cannot handle an empty query.
 */
const isNotEmpty = (query: string): Boolean => {
  return query !== "";
};

/**
 * By default the authors comes as a list of strings.
 * This converts them into display ready text.
 */
const toList = (authors: string[]): string => {
  const delimiter = ",";
  return authors.join(delimiter);
};

/**
 * This method parses a book into a LaTeX style citation
 */
const cite = ({ title, year, authors, url }: Book): string => {
  const label = "label";
  return `
  @online{ ${label},
    author = {${toList(authors)}},
    title = {${title}},
    year = {${year}},
    url = {${url}}
  }
  `;
};

// Empty search queries break the scholarly API
const scholar = async (query: string) => {
  const results: Book[] = await search(query);
  return isNotEmpty(query) ? results : [];
};

export { scholar, cite, toList };
