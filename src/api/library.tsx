import React, { createContext, useState, useEffect, useContext } from "react";
import { collection } from "./firebase";
import { useUser } from "./user";

/**
 * This class is represents the user library as a global variable.
 * We store the business logic for interactions with that library here.
 */

/**
 * This is a refactoring of IArticle name for simplification.
 */
export type Book = {
  title: string;
  year: number;
  authors: string[];
  url?: string | undefined;
  numCitations?: number | undefined;
  description?: string;
  pdf?: string;
  relatedUrl?: string;
  urlVersionsList?: string;
  publication?: string;
};

const LibraryContext = createContext<any[]>([]);

export function serialize(object: any): string {
  return JSON.parse(JSON.stringify(object));
}

export function urlFriendly(id: string) {
  return id.replace(/ /g, "_");
}

export const useLibrary = () => useContext(LibraryContext);

const LibraryProvider: React.FC = ({ children }) => {
  const [library, setLibrary] = useState<any[]>([]);
  const user = useUser();

  useEffect(() => {
    // Only load their library once they have signed in
    if (user) {
      collection(user.uid)
        .orderBy("title")
        .onSnapshot(querySnapshot => {
          const data: any = querySnapshot.docs.map(doc => doc.data());
          setLibrary(data);
        });
    }
  }, [user]);

  const isNotADuplicate = (book: Book) => {
    return !library.includes(book);
  };

  const addToLibrary = (book: Book) => {
    const data = {
      book: serialize(book),
      uid: `${urlFriendly(book.title + book.year)}`
    };
    collection(user.uid)
      .doc(data.uid)
      .set(book)
      .catch(function(error) {
        error("Error writing document: ", error);
      });
  };

  const error = (message: string) => {
    console.log(message);
  };

  const add = (book: Book) => {
    isNotADuplicate(book)
      ? addToLibrary(book)
      : error(`"${book.title} (${book.year})" is already in the library`);
  };

  const find = (title: string) => {};

  const remove = (title: string) => {
    collection(user.uid)
      .get()
      .then(querySnapshot => {
        querySnapshot.docs.forEach(doc => {
          if (doc.data().title === title) {
            collection(user.uid)
              .doc(doc.id)
              .delete();
          }
        });
      });
  };

  const clear = () => {
    setLibrary([]);
  };

  return (
    <LibraryContext.Provider value={[library, find, add, remove, clear]}>
      {children}
    </LibraryContext.Provider>
  );
};

export default LibraryProvider;
