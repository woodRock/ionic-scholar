import { 
  IonButton, 
  IonInput, 
  IonItem, 
  IonLabel, 
  IonText, 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonContent,
  IonIcon
} from "@ionic/react";
import { closeOutline, barChartOutline } from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { serialize, urlFriendly } from "../api/library";
import { useUser } from "../api/user";
import { collection, DocumentSnapshot } from "../api/firebase";

/**
 * Lets users track their progress through each paper.
 */

interface ProgressProps {
  children?: React.ReactNode;
  book: any;
  bid: string;
}

const Progress: React.FC<ProgressProps> = ({ book, bid }) => {
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [totalInput, setTotalInput] = useState("");
  const [edit, setEdit] = useState(false);
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
    collection(user.uid).doc(bid).set(updatedBook, { merge: true });
  };

  const getPercentage = () => {
    const current = Number(input) || 0;
    const total = Number(totalInput) || 1;
    return Math.round((current / total) * 100);
  };

  return (
    <>
      <IonButton fill="outline" shape="round" color="success" onClick={() => setShowModal(true)}>
        <IonIcon slot="start" icon={barChartOutline} />
        {enabled ? `Progress: ${getPercentage()}%` : "Track Progress"}
      </IonButton>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} breakpoints={[0, 0.4]} initialBreakpoint={0.4}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Reading Progress</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          {!enabled ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '20px' }}>
                Set the total number of pages to start tracking your reading progress for this paper.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <IonInput
                  type="number"
                  placeholder="Total pages"
                  value={totalInput}
                  onIonInput={e => setTotalInput(e.detail.value!)}
                  style={{ background: 'var(--ion-color-step-100)', borderRadius: '8px', padding: '0 12px' }}
                />
                <IonButton onClick={() => { setEnabled(true); firebase(); }}>Start Tracking</IonButton>
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
                <h4 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--ion-color-primary)' }}>{getPercentage()}%</h4>
                <span style={{ fontSize: '1rem', color: 'var(--ion-color-step-600)' }}>{input || 0} of {totalInput} pages read</span>
              </div>
              
              <div style={{ width: '100%', height: '16px', background: 'var(--ion-color-step-100)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ width: `${getPercentage()}%`, height: '100%', background: 'var(--ion-color-primary)', transition: 'width 0.3s ease' }}></div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <IonLabel style={{ fontWeight: '600', minWidth: '100px' }}>Current Page:</IonLabel>
                <IonInput
                  type="number"
                  value={input}
                  onIonInput={e => setInput(e.detail.value!)}
                  style={{ background: 'var(--ion-color-step-100)', borderRadius: '8px', padding: '0 12px', maxWidth: '80px' }}
                />
                <IonButton onClick={firebase} style={{ flex: 1 }}>Update</IonButton>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </>
  );
};

export default Progress;