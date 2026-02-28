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
  IonSpinner,
  useIonToast,
  IonBadge,
} from "@ionic/react";
import { closeOutline, addOutline, checkmarkOutline } from "ionicons/icons";
import React, { useState, useEffect } from "react";
import { Book, useLibrary } from "../api/library";
import { getRecommendations } from "../api/scholar";

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTitles: string[];
}

const RecommendationsModal: React.FC<RecommendationsModalProps> = ({ isOpen, onClose, selectedTitles }) => {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [library, , add] = useLibrary();
  const [present] = useIonToast();

  useEffect(() => {
    if (isOpen && selectedTitles.length > 0) {
      fetchRecommendations();
    } else if (!isOpen) {
      setRecommendations([]);
    }
  }, [isOpen, selectedTitles]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const results = await getRecommendations(selectedTitles);
      setRecommendations(results);
    } catch (error) {
      console.error("Failed to load recommendations", error);
      present({ message: "Failed to load recommendations.", duration: 3000, color: "danger" });
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyInLibrary = (title: string) => {
    return library.some((b: any) => b.title.toLowerCase() === title.toLowerCase());
  };

  const handleAdd = (book: Book) => {
    add(book);
    present({ message: "Added to library!", duration: 2000, color: "success" });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Recommendations</IonTitle>
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
            Based on your {selectedTitles.length} selected paper(s).
          </IonLabel>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonSpinner name="crescent" />
            <p>Analyzing Semantic Scholar Graph...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ion-color-step-500)' }}>
            <p>No recommendations found for these specific papers.</p>
          </div>
        ) : (
          <IonList style={{ background: 'transparent' }}>
            {recommendations.map((book, idx) => {
              const inLibrary = isAlreadyInLibrary(book.title);
              return (
                <IonItem key={idx} style={{ '--background': 'var(--ion-color-step-50)', marginBottom: '8px', borderRadius: '8px' }}>
                  <IonLabel className="ion-text-wrap">
                    <h2 style={{ fontWeight: '600' }}>{book.title}</h2>
                    <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                      {book.authors.join(", ")} • {book.year}
                    </p>
                    <div style={{ marginTop: '6px' }}>
                      <IonBadge color="light" style={{ marginRight: '6px' }}>{book.numCitations || 0} Citations</IonBadge>
                      {book.publication && <IonBadge color="medium">{book.publication}</IonBadge>}
                    </div>
                  </IonLabel>
                  <IonButton 
                    slot="end" 
                    fill={inLibrary ? "clear" : "solid"} 
                    color={inLibrary ? "success" : "primary"}
                    disabled={inLibrary}
                    onClick={() => handleAdd(book)}
                  >
                    <IonIcon slot="icon-only" icon={inLibrary ? checkmarkOutline : addOutline} />
                  </IonButton>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
};

export default RecommendationsModal;