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

const Progress: React.FC<ProgressProps> = ({ book, bid }) => {
  const [input, setInput] = useState("");
  const [edit, setEdit] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [totalInput, setTotalInput] = useState("");
  const [totalEdit, setTotalEdit] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user && bid) {
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
      return () => unsubscribe?.();
    }
  }, [bid, user]);

  const firebase = () => {
    if (!book || !user) return;
    const updatedBook = {
      ...book,
      progress: { current: Number(input), total: Number(totalInput) }
    };
    collection(user.uid).doc(urlFriendly(book.title + book.year)).set(updatedBook);
  };

  const getPercentage = () => {
    const current = Number(input) || 0;
    const total = Number(totalInput) || 1;
    return Math.round((current / total) * 100);
  };

  if (!enabled) {
    return (
      <div style={{ textAlign: 'center', padding: '10px' }}>
        {totalEdit ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <IonInput
              placeholder="Total pages"
              value={totalInput}
              onIonChange={e => setTotalInput(e.detail.value!)}
              style={{ background: 'var(--ion-color-step-50)', borderRadius: '8px', padding: '0 10px' }}
            />
            <IonButton onClick={() => { setEnabled(true); setTotalEdit(false); firebase(); }}>Set</IonButton>
          </div>
        ) : (
          <IonButton fill="outline" onClick={() => setTotalEdit(true)}>Enable Progress Tracking</IonButton>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-end' }}>
        <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--ion-color-primary)' }}>{getPercentage()}%</h4>
        <span style={{ fontSize: '0.8rem', color: 'var(--ion-color-step-500)' }}>{input || 0} / {totalInput} pages</span>
      </div>
      
      <div style={{ width: '100%', height: '12px', background: 'var(--ion-color-step-100)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ width: `${getPercentage()}%`, height: '100%', background: 'var(--ion-color-primary)', transition: 'width 0.3s ease' }}></div>
      </div>

      {edit ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <IonInput
            value={input}
            onIonChange={e => setInput(e.detail.value!)}
            placeholder="Current page"
            style={{ background: 'var(--ion-color-step-50)', borderRadius: '8px', padding: '0 10px' }}
          />
          <IonButton onClick={() => { setEdit(false); firebase(); }}>Update</IonButton>
        </div>
      ) : (
        <IonButton fill="clear" size="small" onClick={() => setEdit(true)} style={{ '--padding-start': '0' }}>Update Current Page</IonButton>
      )}
    </div>
  );
};

export default Progress;