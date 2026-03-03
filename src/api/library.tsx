import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { collection, LibraryCollection, writeBatch, firestore } from "./firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useUser } from "./user";
import { findPaperUrl, fetchMetadataByDoi, scholar } from "./scholar";

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
   * Background process to enrich papers missing URLs or Tags
   */
  useEffect(() => {
    if (!user || library.length === 0 || processingRef.current) return;

    const dictionary = [
      "Machine Learning", "Deep Learning", "CNN", "RNN", "Transformer", "NLP", 
      "Computer Vision", "Mass Spectrometry", "REIMS", "iKnife", "Fish", 
      "Aquaculture", "Fraud", "Traceability", "Spectroscopy", "Metabolomics", 
      "Lipidomics", "DNA Barcoding", "Microplastics", "Heavy Metals", "Classification",
      "Regression", "Anomaly Detection", "Food Safety", "Sustainable", "Spectral"
    ];

    const enrichMissingData = async () => {
      if (processingRef.current) return;
      processingRef.current = true;

      // Prioritize papers missing critical metadata (abstract, url, or tags)
      const missing = library.filter(b => 
        !b.url || b.url === "" || 
        !b.description || b.description === "" ||
        !b.keywords || b.keywords.length === 0 ||
        !b.doi || b.doi === ""
      ).slice(0, 10);
      
      if (missing.length === 0) {
        processingRef.current = false;
        return;
      }

      console.log(`[Background] Attempting to enrich batch of ${missing.length} papers...`);

      for (const book of missing) {
        // Respect API rate limits (1 request every 10s for free tier stability)
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
          let paper: Partial<Book> | null = null;

          // 1. Try DOI lookup if available
          if (book.doi) {
            paper = await fetchMetadataByDoi(book.doi);
          }

          // 2. Fallback to title search if DOI lookup failed or wasn't possible
          if (!paper) {
            const results = await scholar(book.title);
            // Match title precisely to avoid noise
            paper = results.find(r => 
              r.title.toLowerCase().includes(book.title.toLowerCase()) || 
              book.title.toLowerCase().includes(r.title.toLowerCase())
            ) || results[0] || null;
          }
          
          if (paper) {
            const updates: any = {};
            
            // Critical metadata enrichment
            if (!book.url && paper.url) updates.url = paper.url;
            if (!book.description && paper.description) updates.description = paper.description;
            if (!book.doi && paper.doi) updates.doi = paper.doi;
            if (paper.numCitations !== undefined) updates.numCitations = paper.numCitations;
            
            // Secondary metadata enrichment (if missing or unknown)
            if ((!book.journal || book.journal === "Unknown") && paper.journal) updates.journal = paper.journal;
            if ((!book.publication || book.publication === "Unknown") && paper.publication) updates.publication = paper.publication;
            if (!book.volume && paper.volume) updates.volume = paper.volume;
            if (!book.pages && paper.pages) updates.pages = paper.pages;
            if (!book.year && paper.year) updates.year = paper.year;

            // Automated Tagging Logic
            const existingKeywords = (book.keywords || []).map((k: string) => k.toLowerCase());
            const newKeywords = new Set<string>(existingKeywords);

            // 1. Add fields of study from Semantic Scholar
            if (paper.keywords) {
              paper.keywords.forEach((k: string) => newKeywords.add(k.toLowerCase()));
            }

            // 2. Dictionary-based matching (from title and abstract)
            const textToScan = ((book.title || "") + " " + (paper.description || book.description || "")).toLowerCase();
            dictionary.forEach(term => {
              if (textToScan.includes(term.toLowerCase())) {
                newKeywords.add(term.toLowerCase());
              }
            });

            if (newKeywords.size > existingKeywords.length) {
              updates.keywords = Array.from(newKeywords);
            }

            if (Object.keys(updates).length > 0) {
              console.log(`[Background] Enriched: ${book.title} (Fields: ${Object.keys(updates).join(", ")})`);
              await collection(user.uid).doc(book.bid).set(serialize({ ...book, ...updates }), { merge: true });
            }
          } else {
            // If no metadata found, mark as "skipped" by setting a small internal flag 
            // to prevent repeated useless lookups in the same session
            (book as any)._enrichSkipped = true;
          }
        } catch (err: any) {
          if (err.message === "RATE_LIMIT") {
            console.warn("[Background] Rate limited. Stopping batch.");
            break;
          }
          console.error("[Background] Error enriching paper:", book.title);
          break;
        }
      }
      processingRef.current = false;
    };

    enrichMissingData();
  }, [library.length, user]);

  const addToLibrary = (book: Book) => {
    if (!user) return;
    
    // Ensure essential fields exist for Firebase and normalize tags
    const cleanBook = serialize({
      ...book,
      pdf: book.pdf || "https://ithemes.com/wp-content/uploads/2016/10/Funny-404-Pages-GitHub.png",
      authors: book.authors || ["Unknown Author"],
      year: book.year || new Date().getFullYear(),
      numCitations: book.numCitations || 0,
      description: book.description || "",
      keywords: (book.keywords || []).map((k: string) => k.toLowerCase())
    });

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

    collection(user.uid).doc(bid).set(serialize(normalizedData), { merge: true })
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

const useLibrary = () => {
  const context = useContext(LibraryContext);
  const [library] = context;
  
  const projects = Array.from(new Set(
    library
      .map((book: any) => book.project)
      .filter((p: string | undefined) => p && p.trim() !== "")
  )).sort() as string[];

  return [...context, projects];
};

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
  journal?: string;
  volume?: string;
  number?: string;
  pages?: string;
  doi?: string;
  bibtexKey?: string;
  keywords?: string[];
  notes?: string;
  rating?: number;
  inReadingList?: boolean;
  project?: string;
};

const serialize = (object: any): any => {
  const result: any = {};
  Object.keys(object).forEach(key => {
    if (object[key] !== undefined) {
      if (object[key] !== null && typeof object[key] === 'object' && !Array.isArray(object[key])) {
        result[key] = serialize(object[key]);
      } else {
        result[key] = object[key];
      }
    }
  });
  return result;
};

const urlFriendly = (id: string) => {
  return id.replace(/[^a-z0-9]/gi, "_").toLowerCase();
};

export default LibraryProvider;
export { serialize, urlFriendly, useLibrary };