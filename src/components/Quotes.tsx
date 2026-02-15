import { IonButton, IonInput, IonItem, IonLabel, IonList, IonIcon } from "@ionic/react";
import { closeCircleOutline, addOutline } from "ionicons/icons";
import { v4 } from "uuid";
import React, { useEffect, useState } from "react";
import { collection, DocumentSnapshot } from "../api/firebase";
import { useUser } from "../api/user";
import { serialize, urlFriendly } from "../api/library";

// Define component props
interface QuotesProps {
  children?: React.ReactNode;
  book: any;
  bid: string;
}

/**
 * A user can store relevant quotes from each paper.
 * These are a comma separated list in quotations.
 * More than one quote can be stored for each text.
 *
 * @param props Component properties
 */
const Quotes: React.FC<QuotesProps> = ({ book, bid }) => {
  const [input, setInput] = useState("");
  const [quotes, setQuotes] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (user && bid) {
      const unsubscribe = collection(user.uid)
        .doc(bid)
        .onSnapshot((doc: DocumentSnapshot) => {
          if (doc?.exists) {
            setQuotes(doc.data()?.quotes || []);
          }
        });
      return () => unsubscribe?.();
    }
  }, [bid, user]);

  const saveQuotes = (newQuotes: string[]) => {
    if (!book || !user || !bid) return;
    const updatedBook = { ...book, quotes: newQuotes };
    collection(user.uid).doc(bid).set(updatedBook);
  };

  const handleAdd = () => {
    if (!input.trim()) return;
    const newQuotes = [...quotes, input.trim()];
    saveQuotes(newQuotes);
    setInput("");
    setShowInput(false);
  };

  const removeQuote = (index: number) => {
    saveQuotes(quotes.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        {quotes.map((q, i) => (
          <div key={i} style={{ 
            padding: '12px 16px', 
            background: 'var(--ion-color-step-50)', 
            borderRadius: '8px', 
            borderLeft: '4px solid var(--ion-color-primary)',
            position: 'relative'
          }}>
            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.95rem' }}>&quot;{q}&quot;</p>
            <IonButton 
              fill="clear" 
              size="small" 
              color="danger" 
              onClick={() => removeQuote(i)}
              style={{ position: 'absolute', top: 0, right: 0 }}
            >
              <IonIcon icon={closeCircleOutline} slot="icon-only" />
            </IonButton>
          </div>
        ))}
      </div>

      {showInput ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <IonInput
            placeholder="Paste quote here..."
            value={input}
            onIonChange={e => setInput(e.detail.value!)}
            style={{ background: 'var(--ion-color-step-50)', borderRadius: '8px', padding: '0 10px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <IonButton size="small" onClick={handleAdd}>Save Quote</IonButton>
            <IonButton size="small" fill="clear" onClick={() => setShowInput(false)}>Cancel</IonButton>
          </div>
        </div>
      ) : (
        <IonButton fill="outline" size="small" onClick={() => setShowInput(true)}>
          <IonIcon slot="start" icon={addOutline} />
          Add Quote
        </IonButton>
      )}
    </div>
  );
};

export default Quotes;