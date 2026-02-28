import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  useIonToast,
} from "@ionic/react";
import { closeOutline, warningOutline, trashOutline, checkmarkOutline } from "ionicons/icons";
import React, { useState, useEffect, useMemo } from "react";
import { Book, useLibrary } from "../api/library";

interface DuplicateFinderProps {
  isOpen: boolean;
  onClose: () => void;
}

const normalizeTitle = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const DuplicateFinder: React.FC<DuplicateFinderProps> = ({ isOpen, onClose }) => {
  const [library, , , remove] = useLibrary();
  const [present] = useIonToast();
  const [duplicates, setDuplicates] = useState<Book[][]>([]);

  // Find duplicates on open
  useEffect(() => {
    if (isOpen) {
      const groups: Record<string, Book[]> = {};
      library.forEach((book: any) => {
        const norm = normalizeTitle(book.title);
        if (!groups[norm]) groups[norm] = [];
        groups[norm].push(book);
      });

      const dupes = Object.values(groups).filter(group => group.length > 1);
      setDuplicates(dupes);
    }
  }, [isOpen, library]);

  const handleKeep = (groupIndex: number, keepBid: string) => {
    const group = duplicates[groupIndex];
    let deletedCount = 0;
    
    group.forEach(book => {
      if (book.bid !== keepBid) {
        remove(book.title);
        deletedCount++;
      }
    });

    present({ message: `Removed ${deletedCount} duplicate(s).`, duration: 2000, color: "success" });
    
    // Remove group from view
    const nextDuplicates = [...duplicates];
    nextDuplicates.splice(groupIndex, 1);
    setDuplicates(nextDuplicates);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Find Duplicates</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: '16px' }}>
          <IonLabel color="medium" style={{ fontSize: '0.9rem' }}>
            We've scanned your library for entries with highly similar titles.
          </IonLabel>
        </div>

        {duplicates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ion-color-step-500)' }}>
            <IonIcon icon={checkmarkOutline} style={{ fontSize: '48px', color: 'var(--ion-color-success)' }} />
            <p style={{ marginTop: '16px', fontWeight: '500' }}>Your library looks clean!</p>
            <p style={{ fontSize: '0.8rem' }}>No duplicates found.</p>
          </div>
        ) : (
          <div>
            {duplicates.map((group, gIdx) => (
              <IonCard key={gIdx} style={{ margin: '0 0 20px 0', border: '1px solid var(--ion-color-warning)' }}>
                <div style={{ background: 'var(--ion-color-warning)', color: 'white', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={warningOutline} />
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{group.length} Similar Entries Found</span>
                </div>
                <IonList lines="full" style={{ padding: 0 }}>
                  {group.map((book, bIdx) => (
                    <IonItem key={book.bid || bIdx}>
                      <IonLabel className="ion-text-wrap">
                        <h3 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{book.title}</h3>
                        <p style={{ fontSize: '0.8rem' }}>{book.authors?.join(", ")} • {book.year}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--ion-color-step-500)', marginTop: '4px' }}>
                          Added on: {book.bid ? book.bid.split("_")[1] : 'Unknown'} | {book.notes ? 'Has Notes' : 'No Notes'} | {book.project || 'No Project'}
                        </p>
                      </IonLabel>
                      <IonButton 
                        slot="end" 
                        color="primary" 
                        fill="outline" 
                        size="small"
                        onClick={() => handleKeep(gIdx, book.bid!)}
                      >
                        Keep This
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default DuplicateFinder;