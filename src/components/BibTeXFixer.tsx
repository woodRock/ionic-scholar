import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonTextarea,
  IonProgressBar,
  IonLabel,
  useIonToast,
  IonList,
  IonItem,
  IonBadge,
  IonNote,
} from "@ionic/react";
import { buildOutline, closeOutline, copyOutline, checkmarkCircleOutline } from "ionicons/icons";
import React, { useState } from "react";
import { Book } from "../api/library";
import { parseBibTeX } from "../api/bibtex";
import { scholar, cite } from "../api/scholar";

const BibTeXFixer: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const [bibInput, setBibInput] = useState("");
  const [fixedBib, setFixedBib] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState("");
  const [present] = useIonToast();

  const showToast = (message: string, color: string = "dark") => {
    present({
      message,
      duration: 3000,
      position: "bottom",
      color: color,
      buttons: [{ text: 'dismiss', role: 'cancel' }]
    });
  };

  const handleFix = async () => {
    try {
      const { books, totalFound } = parseBibTeX(bibInput);
      
      if (totalFound === 0) {
        showToast("No BibTeX entries found.", "warning");
        return;
      }

      setIsProcessing(true);
      setProgress(0);
      const fixedBooks: Book[] = [];

      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        setCurrentAction(`Searching for: ${book.title.substring(0, 40)}...`);
        
        try {
          // Search for the paper to get better metadata
          const results = await scholar(book.title);
          const match = results.find(r => 
            r.title.toLowerCase().includes(book.title.toLowerCase()) || 
            book.title.toLowerCase().includes(r.title.toLowerCase())
          ) || results[0];

          if (match) {
            // Merge metadata, prioritizing existing if it's not "Unknown" or empty
            const fixedBook: Book = {
              ...book,
              journal: book.journal || match.journal || match.publication,
              publication: book.publication || match.publication || match.journal,
              volume: book.volume || match.volume,
              number: book.number || match.number,
              pages: book.pages || match.pages,
              doi: book.doi || match.doi,
              url: book.url || match.url,
              year: book.year || match.year,
              description: book.description || match.description,
              bibtexKey: book.bibtexKey // Maintain the original identifier
            };
            fixedBooks.push(fixedBook);
          } else {
            fixedBooks.push(book);
          }
        } catch (err) {
          console.error("Error fixing entry:", book.title, err);
          fixedBooks.push(book);
        }

        setProgress((i + 1) / books.length);
        // Small delay to be kind to APIs (1s per item is safe for SS free tier)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const output = fixedBooks.map(b => cite(b)).join("\n\n");
      setFixedBib(output);
      setIsProcessing(false);
      setCurrentAction("Done!");
      showToast("Finished fixing citations!", "success");
    } catch (error) {
      console.error("Fixer Error:", error);
      setIsProcessing(false);
      showToast("An error occurred during processing.", "danger");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fixedBib);
    showToast("Copied to clipboard!", "success");
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>BibTeX Fixer Tool</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: '20px' }}>
          <IonLabel color="medium" style={{ fontSize: '0.9rem' }}>
            This tool uses Semantic Scholar to find missing fields (pages, volume, DOI, etc.) for your citations.
          </IonLabel>
        </div>

        {!fixedBib && !isProcessing && (
          <>
            <IonTextarea
              placeholder="Paste your BibTeX here..."
              value={bibInput}
              onIonInput={(e) => setBibInput(e.detail.value!)}
              rows={15}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem', 
                background: 'var(--ion-color-step-50)',
                borderRadius: '12px',
                border: '1px solid var(--ion-border-color)',
                '--padding-start': '12px',
              }}
            />
            <IonButton expand="block" style={{ marginTop: '20px' }} onClick={handleFix} disabled={!bibInput.trim()}>
              <IonIcon slot="start" icon={buildOutline} />
              Scan and Fix Missing Fields
            </IonButton>
          </>
        )}

        {isProcessing && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <IonProgressBar value={progress} color="primary" style={{ height: '8px', borderRadius: '4px' }} />
            <p style={{ marginTop: '16px', fontWeight: '500' }}>{currentAction}</p>
            <p style={{ color: 'var(--ion-color-step-500)', fontSize: '0.8rem' }}>
              Processing {Math.round(progress * 100)}%
            </p>
          </div>
        )}

        {fixedBib && !isProcessing && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <IonLabel color="success" style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <IonIcon icon={checkmarkCircleOutline} />
                Fixed BibTeX Generated
              </IonLabel>
              <IonButton fill="clear" size="small" onClick={copyToClipboard}>
                <IonIcon slot="start" icon={copyOutline} />
                Copy All
              </IonButton>
            </div>
            <IonTextarea
              readonly
              value={fixedBib}
              rows={15}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.8rem', 
                background: 'var(--ion-color-step-50)',
                borderRadius: '12px',
                border: '1px solid var(--ion-border-color)',
                '--padding-start': '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <IonButton expand="block" style={{ flex: 1 }} fill="outline" onClick={() => setFixedBib("")}>
                Start Over
              </IonButton>
              <IonButton expand="block" style={{ flex: 1 }} onClick={copyToClipboard}>
                Copy Result
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonModal>
  );
};

export default BibTeXFixer;