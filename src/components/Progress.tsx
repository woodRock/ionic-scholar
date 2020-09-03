import { IonLabel, IonText, IonItem, IonButton, IonInput } from "@ionic/react";
import React, { useState, useEffect } from "react";
import { serialize, urlFriendly } from "../api/library";
import { useUser } from "../api/user";
import { collection } from "../api/firebase";

type Props = {
  children?: React.ReactNode;
  book?: any;
  bid?: string;
};

const Progress: React.FC = ({ children, book, bid }: Props) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [totalInput, setTotalInput] = useState("");
  const [totalEdit, setTotalEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      const unsubscribe = collection(user.uid)
        .doc(bid)
        .onSnapshot(doc => {
          if (doc !== undefined) {
            const docX = doc as any;
            const progress = docX.data().progress;
            if (progress) {
              setEnabled(true);
              setInput(`${progress.current}`);
              setTotalInput(`${progress.total}`);
            }
          }
        });
    }
  }, [bid, user]);

  const firebase = () => {
    if (!book) {
      return;
    }
    const progress = serialize({
      current: Number(input),
      total: Number(totalInput)
    });
    book = {
      ...book,
      progress: progress
    };
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

  const roundNumber = (current: number): string => {
    const decimalPlaces = 0;
    return current.toFixed(decimalPlaces);
  };

  const progress = (current: number, total: number): string => {
    const percentage = (current / total) * 100;
    return `${roundNumber(percentage)}%`;
  };

  const updateCurrent = () => {
    const current = Number(input);
    const total = Number(totalInput);
    if (current > total || current < 0) {
      return;
    }
    setEdit(false);
    firebase();
  };

  const setTheTotal = () => {
    setTotalEdit(false);
    setEnabled(true);
    firebase();
  };

  if (!enabled) {
    if (totalEdit) {
      return (
        <IonItem>
          <IonInput
            type="text"
            value={totalInput}
            placeholder="total pages: e.g. 500"
            onIonChange={e => setTotalInput(e.detail.value!)}
          ></IonInput>
          <IonItem>
            <IonButton onClick={setTheTotal}>Set</IonButton>
          </IonItem>
        </IonItem>
      );
    }

    return (
      <IonItem>
        <IonLabel>Progress</IonLabel>
        <IonButton onClick={e => setTotalEdit(true)}>Enable</IonButton>
      </IonItem>
    );
  }

  if (edit) {
    return (
      <IonItem>
        <IonInput
          type="text"
          value={input}
          onIonChange={e => setInput(e.detail.value!)}
          placeholder={`current page: e.g. 100`}
        ></IonInput>
        <IonText>{` of ${totalInput} pages`}</IonText>
        <IonButton slot="end" onClick={updateCurrent}>
          Set
        </IonButton>
      </IonItem>
    );
  }

  return (
    <IonItem>
      <IonLabel slot="start">
        <progress value={Number(input)} max={Number(totalInput)} />
      </IonLabel>
      <IonText>{progress(Number(input), Number(totalInput))}</IonText>
      <IonButton slot="end" onClick={e => setEdit(!edit)}>
        Edit
      </IonButton>
    </IonItem>
  );
};

export default Progress;
