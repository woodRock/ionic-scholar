import { IonTextarea } from "@ionic/react";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { collection, DocumentSnapshot } from "../api/firebase";
import { useUser } from "../api/user";

// Define component props
interface NotesProps {
  children?: React.ReactNode;
  book: any;
  bid: string;
}

/**
 * A user can store markdown notes for each paper.
 *
 * @param props Component properties
 */
const Notes: React.FC<NotesProps> = ({ book, bid }) => {
  const [notes, setNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const { user } = useUser();

  useEffect(() => {
    if (user && bid) {
      const unsubscribe = collection(user.uid)
        .doc(bid)
        .onSnapshot((doc: DocumentSnapshot) => {
          if (doc?.exists) {
            setNotes(doc.data()?.notes || "");
          }
        });
      return () => unsubscribe?.();
    }
  }, [bid, user]);

  const saveNotes = () => {
    if (!book || !user || !bid) return;
    // Only save if content actually changed to avoid unnecessary writes
    if (editValue !== notes) {
      collection(user.uid).doc(bid).set({ notes: editValue }, { merge: true });
    }
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditValue(notes);
    setIsEditing(true);
  };

  return (
    <div style={{ position: 'relative' }}>
      {!isEditing ? (
        <div 
          onDoubleClick={startEditing}
          style={{ 
            minHeight: '100px', 
            cursor: 'text',
            padding: '8px'
          }}
          title="Double click to edit"
        >
          <div className="markdown-body" style={{ 
            color: 'var(--ion-color-step-800)',
            lineHeight: '1.6',
            fontSize: '1rem'
          }}>
            {notes ? (
              <ReactMarkdown>{notes}</ReactMarkdown>
            ) : (
              <p style={{ color: 'var(--ion-color-step-400)', fontStyle: 'italic' }}>
                Double click here to add markdown notes for this paper...
              </p>
            )}
          </div>
          {notes && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--ion-color-step-400)', 
              marginTop: '16px',
              textAlign: 'right'
            }}>
              (Double click to edit)
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <IonTextarea
            autoFocus
            rows={10}
            placeholder="Write your notes here (Markdown supported)..."
            value={editValue}
            onIonInput={e => setEditValue(e.detail.value!)}
            onIonBlur={saveNotes}
            style={{ 
              background: 'var(--ion-color-step-50)', 
              borderRadius: '8px', 
              padding: '12px',
              fontFamily: 'monospace',
              border: '1px solid var(--ion-color-primary)',
              '--padding-start': '12px',
              '--padding-end': '12px'
            } as any}
          />
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--ion-color-step-500)', 
            textAlign: 'right'
          }}>
            Saving automatically when you click away...
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
