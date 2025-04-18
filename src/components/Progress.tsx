import { IonButton, IonInput, IonItem, IonLabel, IonText } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { serialize, urlFriendly } from "../api/library";
import { useUser } from "../api/user";
import { collection, DocumentSnapshot } from "../api/firebase";

/**
 * Lets users track their progress through each paper.
 * This is calculated as a percentage of pages read of the total.
 * A user manually enters the total number of pages.
 * Then they can update their current page as they see fit.
 * This information is stored on Firebase.
 *
 * @param props Component props containing book and bid
 */

// Define proper types for the component
interface ProgressProps {
  children?: React.ReactNode;
  book: any;
  bid: string;
}

const Progress: React.FC<ProgressProps> = ({ children, book, bid }) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [totalInput, setTotalInput] = useState("");
  const [totalEdit, setTotalEdit] = useState(false);
  const user = useUser();

  useEffect(() => {
    if (user && bid) {
      // Set up snapshot listener for the document
      const unsubscribe = collection(user.uid)
        .doc(bid)
        .onSnapshot((doc: DocumentSnapshot) => {
          if (doc !== undefined && doc.exists) {
            const data = doc.data();
            const progress = data?.progress;
            if (progress) {
              setEnabled(true);
              setInput(`${progress.current}`);
              setTotalInput(`${progress.total}`);
            }
          }
        });
      
      // Cleanup function to unsubscribe when component unmounts
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [bid, user]);

  const firebase = () => {
    if (!book || !user) {
      return;
    }
    const progress = serialize({
      current: Number(input),
      total: Number(totalInput),
    });
    const updatedBook = {
      ...book,
      progress: progress,
    };
    const docId = `${urlFriendly(book.title + book.year)}`;
    
    collection(user.uid)
      .doc(docId)
      .set(updatedBook)
      .catch(function (error: any) {
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
            onIonChange={(e) => setTotalInput(e.detail.value!)}
          />
          <IonItem>
            <IonButton onClick={setTheTotal}>Set</IonButton>
          </IonItem>
        </IonItem>
      );
    }

    return (
      <IonItem>
        <IonLabel>Progress</IonLabel>
        <IonButton onClick={() => setTotalEdit(true)}>Enable</IonButton>
      </IonItem>
    );
  }

  if (edit) {
    return (
      <IonItem>
        <IonInput
          type="text"
          value={input}
          onIonChange={(e) => setInput(e.detail.value!)}
          placeholder={`current page: e.g. 100`}
        />
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
      <IonButton slot="end" onClick={() => setEdit(!edit)}>
        Edit
      </IonButton>
    </IonItem>
  );
};

export default Progress;