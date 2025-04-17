import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, LibraryCollection } from "./firebase";
import { useUser } from "./user";

/**
 * This class is represents the user library as a global variable.
 * We store the business logic for interactions with that library here.
 * The library is accessed only one the user has signed in.
 */

const LibraryProvider: React.FC = ({ children }) => {
  const [library, setLibrary] = useState<any[]>([]);
  const user = useUser();

  useEffect(() => {
    if (user) {
      // Using the updated collection API with proper types
      const unsubscribe = collection(user.uid)
        .orderBy("title")
        .onSnapshot((querySnapshot: any) => {
          const data: any = querySnapshot.docs.map((doc: any) => doc.data());
          setLibrary(data);
        });
        
      // Cleanup subscription on unmount
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [user]);

  const isNotADuplicate = (book: Book) => {
    return !library.includes(book);
  };

  const addToLibrary = (book: Book) => {
    if (book.pdf == null) {
      book = {...book, pdf: "https://ithemes.com/wp-content/uploads/2016/10/Funny-404-Pages-GitHub.png" };
    }
    const data = {
      book: serialize(book),
      uid: `${urlFriendly(book.title + book.year)}`,
    };
    
    // Using the updated collection API
    collection(user.uid)
      .doc(data.uid)
      .set(book)
      .catch(function (err: any) {
        console.error("Error writing document: ", err);
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

  const find = (title: string) => {
    return title;
  };

  const remove = (title: string) => {
    // Using the updated collection API
    collection(user.uid)
      .get()
      .then((querySnapshot: any) => {
        querySnapshot.docs.forEach((doc: any) => {
          if (doc.data().title === title) {
            collection(user.uid).doc(doc.id).delete();
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

const LibraryContext = createContext<any[]>([]);

const useLibrary = () => useContext(LibraryContext);

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

const serialize = (object: any): any => {
  return JSON.parse(JSON.stringify(object));
};

const urlFriendly = (id: string) => {
  return id.replace(/ /g, "_");
};

export default LibraryProvider;
export { serialize, urlFriendly, useLibrary };