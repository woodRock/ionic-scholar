import { IonLabel, IonText, IonItem, IonButton, IonInput } from "@ionic/react";
import React, { useState, useEffect } from "react";
import { toList } from "../api/scholar";
import { collection } from "../api/firebase";
import { serialize, urlFriendly } from "../api/library";
import { useUser } from "../api/user";

type Props = {
  children?: React.ReactNode;
  book?: any;
  bid?: string;
};

const Keywords: React.FC = ({ children, book, bid }: Props) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      collection(user.uid)
        .doc(bid)
        .get()
        .then(doc => {
          if (doc !== undefined) {
            const docX = doc as any;
            const keywords = docX.data().keywords;
            setInput(keywords ? keywords.join(",") : "");
          }
        });
    }
  }, [bid, user, user.uid]);

  const addKeyword = () => {
    firebaseKeywords();
    setEdit(!edit);
  };

  const firebaseKeywords = () => {
    book = { ...book, keywords: input.split(",") };
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
          placeholder="keywords: e.g. cats,dogs,fish"
          value={input}
          onIonChange={e => setInput(e.detail.value!)}
        ></IonInput>
        <IonButton slot="end" onClick={addKeyword}>
          Add
        </IonButton>
      </IonItem>
    );
  }

  return (
    <IonItem>
      <IonLabel>Keywords</IonLabel>
      <IonText slot="end">{toList(input.split(","))}</IonText>
      <IonButton slot="end" onClick={e => setEdit(!edit)}>
        Edit
      </IonButton>
    </IonItem>
  );
};

export default Keywords;
