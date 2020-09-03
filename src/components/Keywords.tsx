import { IonButton, IonInput, IonItem, IonLabel, IonText } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { toList } from "../api/scholar";
import { collection } from "../api/firebase";
import { serialize, urlFriendly } from "../api/library";
import { useUser } from "../api/user";

/**
 * We can store keywords for each the contents of our library.
 * These can be used to jog our memory for why we chose to store something.
 * These are stored on Firebase and can be updated.
 *
 * @param children
 * @param book to store keywords for
 * @param bid Firebase unique identifier for book document
 * @constructor
 */
const Keywords: React.FC = ({ children, book, bid }: Props) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      collection(user.uid)
        .doc(bid)
        .get()
        .then((doc) => {
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
      <IonText slot="end">{toList(input.split(","))}</IonText>
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

export default Keywords;
