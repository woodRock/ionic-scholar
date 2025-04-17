import { IonButton, IonInput, IonItem, IonLabel, IonText } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { toList } from "../api/scholar";
import { collection, LibraryCollection } from "../api/firebase";
import { serialize, urlFriendly } from "../api/library";
import { useUser } from "../api/user";

// Define the Book type properly
type Book = {
  title: string;
  year: number;
  authors: string[];
  url?: string;
  numCitations?: number;
  description?: string;
  pdf?: string;
  relatedUrl?: string;
  urlVersionsList?: string;
  publication?: string;
  keywords?: string[];
  [key: string]: any;
};

// Define component props properly
interface KeywordsProps {
  children?: React.ReactNode;
  book: Book;
  bid: string;
}

/**
 * We can store keywords for each the contents of our library.
 * These can be used to jog our memory for why we chose to store something.
 * These are stored on Firebase and can be updated.
 *
 * @param props Component props containing book and bid
 */
const Keywords: React.FC<KeywordsProps> = ({ children, book, bid }) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      collection(user.uid)
        .doc(bid)
        .get()
        .then((doc) => {
          if (doc.exists && doc.data) {
            const keywords = doc.data().keywords;
            setInput(keywords ? keywords.join(",") : "");
          }
        })
        .catch((error: unknown) => {
          console.error("Error fetching keywords:", error);
        });
    }
  }, [bid, user]);

  const addKeyword = () => {
    firebaseKeywords();
    setEdit(!edit);
  };

  const firebaseKeywords = () => {
    if (!book || !user) {
      return;
    }
    
    const updatedBook = { 
      ...book, 
      keywords: input.split(",").map(keyword => keyword.trim()).filter(keyword => keyword !== "") 
    };
    
    const docId = `${urlFriendly(book.title + book.year)}`;
    
    collection(user.uid)
      .doc(docId)
      .set(updatedBook)
      .catch(function (error: any) {
        console.error("Error writing document:", error);
      });
  };

  if (edit) {
    return (
      <IonItem>
        <IonInput
          placeholder="keywords: e.g. cats,dogs,fish"
          value={input}
          onIonChange={(e) => setInput(e.detail.value!)}
        />
        <IonButton slot="end" onClick={addKeyword}>
          Add
        </IonButton>
      </IonItem>
    );
  }

  return (
    <IonItem>
      <IonLabel>Keywords</IonLabel>
      <IonText slot="end">
        {input ? toList(input.split(",").filter(keyword => keyword.trim() !== "")) : ""}
      </IonText>
      <IonButton slot="end" onClick={() => setEdit(!edit)}>
        Edit
      </IonButton>
    </IonItem>
  );
};

export default Keywords;