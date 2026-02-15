import { IonButton, IonInput, IonChip, IonLabel, IonIcon } from "@ionic/react";
import { closeCircleOutline, addOutline } from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { collection } from "../api/firebase";
import { urlFriendly } from "../api/library";
import { useUser } from "../api/user";

// Define the Book type properly
type Book = {
  title: string;
  year: number;
  authors: string[];
  url?: string;
  numCitations?: number;
  description?: string;
  pdf?: string;
  relatedUrl?: string;
  urlVersionsList?: string;
  publication?: string;
  keywords?: string[];
  [key: string]: any;
};

// Define component props properly
interface KeywordsProps {
  children?: React.ReactNode;
  book: Book;
  bid: string;
}

const Keywords: React.FC<KeywordsProps> = ({ book, bid }) => {
  const [input, setInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user && bid) {
      const unsubscribe = collection(user.uid)
        .doc(bid)
        .onSnapshot((doc) => {
          if (doc.exists) {
            setKeywords(doc.data().keywords || []);
          }
        });
      return () => unsubscribe?.();
    }
  }, [bid, user]);

  const saveKeywords = (newKeywords: string[]) => {
    if (!book || !user || !bid) return;
    const updatedBook = { ...book, keywords: newKeywords };
    collection(user.uid).doc(bid).set(updatedBook);
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    const newKeywords = [...keywords, ...input.split(",").map(k => k.trim())].filter(k => k);
    saveKeywords(Array.from(new Set(newKeywords)));
    setInput("");
    setShowInput(false);
  };

  const removeKeyword = (index: number) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    saveKeywords(newKeywords);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
        {keywords.map((k, i) => (
          <IonChip key={i} color="primary" style={{ margin: 0 }}>
            <IonLabel>{k}</IonLabel>
            <IonIcon icon={closeCircleOutline} onClick={() => removeKeyword(i)} />
          </IonChip>
        ))}
        {!showInput && (
          <IonChip onClick={() => setShowInput(true)} outline color="medium" style={{ borderStyle: 'dashed' }}>
            <IonIcon icon={addOutline} />
            <IonLabel>Add Tag</IonLabel>
          </IonChip>
        )}
      </div>

      {showInput && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <IonInput
            placeholder="e.g. physics, quantum"
            value={input}
            onIonChange={e => setInput(e.detail.value!)}
            style={{ background: 'var(--ion-color-step-50)', borderRadius: '8px', padding: '0 10px' }}
          />
          <IonButton onClick={handleAdd}>Add</IonButton>
        </div>
      )}
    </div>
  );
};

export default Keywords;
