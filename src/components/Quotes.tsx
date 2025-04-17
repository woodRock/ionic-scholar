import { IonButton, IonInput, IonItem, IonLabel, IonList } from "@ionic/react";
import { v4 } from "uuid";
import React, { useEffect, useState } from "react";
import { collection, DocumentSnapshot } from "../api/firebase";
import { useUser } from "../api/user";
import { serialize, urlFriendly } from "../api/library";

// Define component props
interface QuotesProps {
  children?: React.ReactNode;
  book: any;
  bid: string;
}

/**
 * A user can store relevant quotes from each paper.
 * These are a comma separated list in quotations.
 * More than one quote can be stored for each text.
 *
 * @param props Component properties
 */
const Quotes: React.FC<QuotesProps> = ({ children, book, bid }) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      collection(user.uid)
        .doc(bid)
        .onSnapshot((doc: DocumentSnapshot) => {
          if (doc !== undefined && doc.exists) {
            const data = doc.data();
            const quotes = data?.quotes;
            setInput(quotes && Array.isArray(quotes) ? `${quotes.join(`","`)}` : "");
          }
        });
    }
  }, [bid, user]);

  const addQuote = () => {
    setEdit(!edit);
    firebase();
  };

  const firebase = () => {
    if (!book || !user) {
      return;
    }
    
    const quotes = input.length
      ? input.split(`","`).map((quote) => quote.replace(/"/g, ""))
      : [];
      
    const updatedBook = {
      ...book,
      quotes: quotes,
    };
    
    const docId = `${urlFriendly(book.title + book.year)}`;
    
    collection(user.uid)
      .doc(docId)
      .set(updatedBook)
      .catch(function (error: any) {
        console.error("Error writing document: ", error);
      });
  };

  if (edit) {
    return (
      <IonItem>
        <IonInput
          type="text"
          value={input}
          placeholder={`e.g. "first","second","third"`}
          onIonChange={(e) => setInput(e.detail.value!)}
        />
        <IonButton slot="end" onClick={addQuote}>
          Add
        </IonButton>
      </IonItem>
    );
  }

  return (
    <IonItem>
      <IonLabel>Quotes</IonLabel>
      <IonList>
        {input.split(`","`).map((quote) => {
          return (
            <IonItem key={v4()}>
              <IonLabel>{input.length ? `"${quote}"` : null}</IonLabel>
            </IonItem>
          );
        })}
      </IonList>
      <IonButton slot="end" onClick={() => setEdit(!edit)}>
        Edit
      </IonButton>
    </IonItem>
  );
};

export default Quotes;