import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonBadge,
} from "@ionic/react";
import CopyToClipboard from "react-copy-to-clipboard";
import { checkmarkOutline, copyOutline, closeOutline, documentTextOutline } from "ionicons/icons";
import React, { useState } from "react";
import { Book } from "../api/library";
import { cite } from "../api/scholar";

interface CitationsProps {
  book: Book;
  bid?: string;
  text?: string;
}

const Citations: React.FC<CitationsProps> = ({ book, text }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const citation = book ? cite(book) : "";

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <IonButton fill="outline" size="small" onClick={() => setShowModal(true)}>
        <IonIcon slot="start" icon={documentTextOutline} />
        {text ? text : "Cite"}
      </IonButton>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} breakpoints={[0, 0.5, 0.8]} initialBreakpoint={0.5}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Citation Tool</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <IonBadge color="primary">BibTeX Format</IonBadge>
              <CopyToClipboard text={citation} onCopy={handleCopy}>
                <IonButton size="small" fill="clear">
                  <IonIcon slot="start" icon={copied ? checkmarkOutline : copyOutline} color={copied ? "success" : "primary"} />
                  {copied ? "Copied!" : "Copy Snippet"}
                </IonButton>
              </CopyToClipboard>
            </div>
            
            <div style={{ 
              background: '#1e293b', 
              color: '#f8fafc', 
              padding: '16px', 
              borderRadius: '12px', 
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              overflowX: 'auto',
              border: '1px solid #334155',
              boxShadow: 'inset 0 2px 4px 0 rgba(0,0,0,0.06)'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{citation}</pre>
            </div>
          </div>

          <IonList lines="none" style={{ background: 'transparent' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, paddingLeft: '16px', color: 'var(--ion-color-step-500)' }}>SUGGESTED USAGE</h3>
            <IonItem style={{ '--background': 'transparent' }}>
              <IonLabel className="ion-text-wrap">
                <p>Add this snippet to your <code>.bib</code> file and reference it in your LaTeX document using <code>\cite{'{'}...{'}'}</code>.</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
};

export default Citations;
