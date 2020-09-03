import { IonButton, IonInput, IonItem, IonLabel, IonList } from "@ionic/react";
import { v4 } from "uuid";
import React, { useEffect, useState } from "react";
import { collection } from "../api/firebase";
import { useUser } from "../api/user";
import { serialize, urlFriendly } from "../api/library";

/**
 * A user can store relevant quotes from each paper.
 * These are a comma separated list in quotations.
 * More than one quote can be stored for each text.
 *
 * @param children
 * @param book to store quotes for
 * @param bid unique indentifier on Firebase firestore
 * @constructor
 */
const Quotes: React.FC = ({ children, book, bid }: Props) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      collection(user.uid)
        .doc(bid)
        .onSnapshot((doc) => {
          if (doc !== undefined) {
            const docX = doc as any;
            const quotes = docX.data().quotes;
            setInput(quotes ? `${quotes.join(`","`)}` : "");
          }
        });
    }
  }, [bid, user]);

  const addQuote = () => {
    setEdit(!edit);
    firebase();
  };

  const firebase = () => {
    const quotes = input.length
      ? input.split(`","`).map((quote) => quote.replace(/"/g, ""))
      : [];
    book = {
      ...book,
      quotes: quotes,
    };
    if (!book) {
      return;
    }
    const data = {
      book: serialize(book),
      uid: `${urlFriendly(book.title + book.year)}`,
    };
    collection(user.uid)
      .doc(data.uid)
      .set(book)
      .catch(function (error) {
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

type Props = {
  children?: React.ReactNode;
  book?: any;
  bid?: string;
};

export default Quotes;
