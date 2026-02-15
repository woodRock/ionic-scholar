import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { collection, LibraryCollection, writeBatch, firestore } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useUser } from "./user";
import { findPaperUrl } from "./scholar";

/**
 * This class is represents the user library as global variable.
 */

const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [library, setLibrary] = useState<any[]>([]);
  const [pinnedTags, setPinnedTags] = useState<string[]>([]);
  const { user } = useUser();
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    if (user) {
      // Subscribe to library
      const unsubscribeLib = collection(user.uid)
        .orderBy("title")
        .onSnapshot((querySnapshot: any) => {
          const data: any = querySnapshot.docs.map((doc: any) => ({
            ...doc.data(),
            bid: doc.id
          }));
          setLibrary(data);
        });

      // Subscribe to pinned tags/settings
      const settingsRef = doc(firestore, `users/${user.uid}/settings/preferences`);
      const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
          setPinnedTags(doc.data().pinnedTags || []);
        }
      });
        
      return () => {
        unsubscribeLib();
        unsubscribeSettings();
      };
    } else {
      setLibrary([]);
      setPinnedTags([]);
    }
  }, [user]);

  const togglePinnedTag = async (tag: string) => {
    if (!user) return;
    const normalized = tag.toLowerCase();
    const newPinned = pinnedTags.includes(normalized)
      ? pinnedTags.filter(t => t !== normalized)
      : [...pinnedTags, normalized];
    
    const settingsRef = doc(firestore, `users/${user.uid}/settings/preferences`);
    await setDoc(settingsRef, { pinnedTags: newPinned }, { merge: true });
  };

  /**
   * Background process to enrich papers missing URLs
   */
  useEffect(() => {
    if (!user || library.length === 0 || processingRef.current) return;

    const enrichMissingUrls = async () => {
      processingRef.current = true;
      // Find papers missing URLs OR abstracts
      const missing = library.filter(b => !b.url || b.url === "" || !b.description || b.description === "");
      
      if (missing.length === 0) {
        processingRef.current = false;
        return;
      }

      console.log(`[Background] Found ${missing.length} papers missing metadata (URL/Abstract). Starting enrichment...`);

      for (const book of missing) {
        // Slow down to avoid rate limits (1 paper every 5 seconds)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
          // Use Semantic Scholar search to find the paper and its metadata
          const response = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(book.title)}&limit=1&fields=url,abstract,citationCount`
          );
          
          if (response.status === 429) throw new Error("RATE_LIMIT");
          if (!response.ok) continue;

          const result = await response.json();
          if (result.data && result.data.length > 0) {
            const paper = result.data[0];
            const updates: any = {};
            
            if (!book.url && paper.url) updates.url = paper.url;
            if (!book.description && paper.abstract) updates.description = paper.abstract;
            if (paper.citationCount !== undefined) updates.numCitations = paper.citationCount;

            if (Object.keys(updates).length > 0) {
              console.log(`[Background] Enriched: ${book.title}`);
              collection(user.uid).doc(book.bid).set({ ...book, ...updates }, { merge: true });
            }
          }
        } catch (err: any) {
          if (err.message === "RATE_LIMIT") {
            console.warn("[Background] Rate limited. Pausing for 60s...");
            await new Promise(resolve => setTimeout(resolve, 60000));
          } else {
            console.error("[Background] Error enriching paper:", err);
          }
        }
      }
      processingRef.current = false;
    };

    enrichMissingUrls();
  }, [library.length, user]);

  const addToLibrary = (book: Book) => {
    if (!user) return;
    
    // Ensure essential fields exist for Firebase and normalize tags
    const cleanBook = {
      ...book,
      pdf: book.pdf || "https://ithemes.com/wp-content/uploads/2016/10/Funny-404-Pages-GitHub.png",
      authors: book.authors || ["Unknown Author"],
      year: book.year || new Date().getFullYear(),
      numCitations: book.numCitations || 0,
      description: book.description || "",
      keywords: (book.keywords || []).map((k: string) => k.toLowerCase())
    };

    // Deterministic ID to prevent duplicates: sanitized title (up to 100 chars) + year
    const docId = `${urlFriendly(cleanBook.title).substring(0, 100)}_${cleanBook.year}`;
    
    collection(user.uid)
      .doc(docId)
      .set(cleanBook)
      .catch(function (err: any) {
        console.error("Error writing document: ", err);
      });
  };

  /**
   * One-time background process to remove legacy duplicates created by random hashes
   */
  useEffect(() => {
    if (!user || library.length === 0) return;

    const cleanupDuplicates = async () => {
      const seen = new Set();
      const duplicates: string[] = [];

      library.forEach(book => {
        const key = `${book.title.toLowerCase()}_${book.year}`;
        if (seen.has(key)) {
          duplicates.push(book.bid);
        } else {
          seen.add(key);
        }
      });

      if (duplicates.length > 0) {
        console.log(`[Cleanup] Found ${duplicates.length} duplicate entries. Cleaning up...`);
        const batch = writeBatch(firestore);
        duplicates.forEach(bid => {
          const docRef = doc(firestore, `users/${user.uid}/library/${bid}`);
          batch.delete(docRef);
        });
        await batch.commit();
      }
    };

    cleanupDuplicates();
  }, [library.length, user]);

  const isNotADuplicate = (book: Book) => {
    return !library.some(b => b.title.toLowerCase() === book.title.toLowerCase());
  };

  const add = (book: Book) => {
    if (isNotADuplicate(book)) {
      addToLibrary(book);
    }
  };

  const find = (title: string) => {
    return title;
  };

  const remove = (title: string) => {
    if (!user) return;
    
    collection(user.uid)
      .get()
      .then((querySnapshot: any) => {
        const batch = writeBatch(firestore);
        let count = 0;
        querySnapshot.docs.forEach((d: any) => {
          const data = d.data();
          if (data && data.title && data.title.toLowerCase() === title.toLowerCase()) {
            const docRef = doc(firestore, `users/${user.uid}/library/${d.id}`);
            batch.delete(docRef);
            count++;
          }
        });
        if (count > 0) {
          return batch.commit();
        }
      })
      .catch(err => console.error("Error removing document: ", err));
  };

  const update = (bid: string, data: Partial<Book>) => {
    if (!user || !bid) return;
    
    // Normalize tags to lowercase if they are being updated
    const normalizedData = { ...data };
    if (normalizedData.keywords) {
      normalizedData.keywords = normalizedData.keywords.map((k: string) => k.toLowerCase());
    }

    collection(user.uid).doc(bid).set(normalizedData, { merge: true })
      .catch(err => console.error("Error updating document: ", err));
  };

  const clearReadingList = () => {
    if (!user) return;
    
    collection(user.uid)
      .get()
      .then((querySnapshot: any) => {
        const batch = writeBatch(firestore);
        let count = 0;
        querySnapshot.docs.forEach((d: any) => {
          if (d.data().inReadingList) {
            const docRef = doc(firestore, `users/${user.uid}/library/${d.id}`);
            batch.set(docRef, { inReadingList: false }, { merge: true });
            count++;
          }
        });
        if (count > 0) return batch.commit();
      })
      .catch((err: any) => {
        console.error("Error clearing reading list: ", err);
      });
  };

  const clear = () => {
    if (!user) return;
    
    collection(user.uid)
      .get()
      .then((querySnapshot: any) => {
        const batch = writeBatch(firestore);
        querySnapshot.docs.forEach((d: any) => {
          const docRef = doc(firestore, `users/${user.uid}/library/${d.id}`);
          batch.delete(docRef);
        });
        return batch.commit();
      })
      .then(() => {
        setLibrary([]);
      })
      .catch((err: any) => {
        console.error("Error clearing library: ", err);
      });
  };

  return (
    <LibraryContext.Provider value={[library, find, add, remove, clear, update, pinnedTags, togglePinnedTag, clearReadingList]}>
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
  bid?: string;
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
  keywords?: string[];
  quotes?: string[];
  rating?: number;
  inReadingList?: boolean;
};

const serialize = (object: any): any => {
  return JSON.parse(JSON.stringify(object));
};

const urlFriendly = (id: string) => {
  return id.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

export default LibraryProvider;
export { serialize, urlFriendly, useLibrary };