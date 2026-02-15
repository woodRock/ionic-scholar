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
  useIonToast,
} from "@ionic/react";
import { downloadOutline, cloudUploadOutline, closeOutline } from "ionicons/icons";
import React, { useState } from "react";
import { useLibrary, Book } from "../api/library";
import { parseBibTeX, exportToBibTeX } from "../api/bibtex";

const BibTeXActions: React.FC = () => {
  const [showImport, setShowImport] = useState(false);
  const [bibInput, setBibInput] = useState("");
  const [library, , add] = useLibrary();
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

  const handleImport = () => {
    try {
      console.log("Starting BibTeX import...");
      const { books, totalFound } = parseBibTeX(bibInput);
      
      if (totalFound === 0) {
        showToast("No BibTeX entries found in the text.", "warning");
        return;
      }

      if (books.length === 0) {
        showToast(`Found ${totalFound} entries, but none could be parsed correctly.`, "danger");
        return;
      }

      console.log(`Parsed ${books.length}/${totalFound} books. Adding to library...`);
      books.forEach((book: Book) => add(book));
      
      showToast(`Successfully imported ${books.length}/${totalFound} items!`, "success");
      setShowImport(false);
      setBibInput("");
    } catch (error) {
      console.error("BibTeX Import Error:", error);
      showToast("Error parsing BibTeX. Please check the console for details.", "danger");
    }
  };

  const handleExport = () => {
    if (library.length === 0) {
      showToast("Library is empty. Nothing to export.", "warning");
      return;
    }
    exportToBibTeX(library);
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <IonButton fill="outline" size="small" onClick={() => setShowImport(true)}>
        <IonIcon slot="start" icon={cloudUploadOutline} />
        Import .bib
      </IonButton>
      
      <IonButton fill="outline" size="small" onClick={handleExport}>
        <IonIcon slot="start" icon={downloadOutline} />
        Export refs.bib
      </IonButton>

      <IonModal isOpen={showImport} onDidDismiss={() => setShowImport(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Import BibTeX</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowImport(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p style={{ color: 'var(--ion-color-step-600)', fontSize: '0.9rem' }}>
            Paste the contents of your <code>.bib</code> file below to add papers to your library.
          </p>
          <IonTextarea
            placeholder="@article{...}"
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
              marginTop: '16px'
            }}
          />
          <IonButton expand="block" style={{ marginTop: '20px' }} onClick={handleImport}>
            Process and Import
          </IonButton>
        </IonContent>
      </IonModal>
    </div>
  );
};

export default BibTeXActions;
