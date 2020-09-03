import { IonLabel, IonList, IonItem, IonButton, IonInput } from "@ionic/react";
import { v4 } from "uuid";
import React, { useState, useEffect } from "react";
import { collection } from "../api/firebase";
import { useUser } from "../api/user";
import { serialize, urlFriendly } from "../api/library";

type Props = {
  children?: React.ReactNode;
  book?: any;
  bid?: string;
};

const Quotes: React.FC = ({ children, book, bid }: Props) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      const unsubscribe = collection(user.uid)
        .doc(bid)
        .onSnapshot(doc => {
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
      ? input.split(`","`).map(quote => quote.replace(/"/g, ""))
      : [];
    book = {
      ...book,
      quotes: quotes
    };
    if (!book) {
      return;
    }
    const data = {
      book: serialize(book),
      uid: `${urlFriendly(book.title + book.year)}`
    };
    collection(user.uid)
      .doc(data.uid)
      .set(book)
      .catch(function(error) {
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
          onIonChange={e => setInput(e.detail.value!)}
        ></IonInput>
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
        {input.split(`","`).map(quote => {
          return (
            <IonItem key={v4()}>
              <IonLabel>{input.length ? `"${quote}"` : null}</IonLabel>
            </IonItem>
          );
        })}
      </IonList>
      <IonButton slot="end" onClick={e => setEdit(!edit)}>
        Edit
      </IonButton>
    </IonItem>
  );
};

export default Quotes;
