import React, { useState, useEffect } from 'react';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonContent, 
  IonFooter,
  IonSpinner,
  IonProgressBar,
  IonLabel,
  useIonToast
} from '@ionic/react';
import { closeOutline, chevronBackOutline, chevronForwardOutline, chatbubbleOutline, bookmarkOutline, documentTextOutline } from 'ionicons/icons';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useLibrary } from '../api/library';

// Set worker URL for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  book: any;
  bid: string;
}

const PDFReader: React.FC<PDFReaderProps> = ({ isOpen, onClose, url, book, bid }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [localNotes, setLocalNotes] = useState<string>("");
  const [, , , , , update] = useLibrary();
  const [present] = useIonToast();

  // Load existing progress and notes
  useEffect(() => {
    if (book?.progress?.current) {
      setPageNumber(book.progress.current);
    }
    if (book?.notes) {
      setLocalNotes(book.notes);
    }
  }, [book, isOpen]);

  // Debounced notes update
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localNotes !== book?.notes) {
        update(bid, { notes: localNotes });
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [localNotes, bid, update, book?.notes]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    // Update total pages if not set
    if (!book?.progress?.total || book.progress.total !== numPages) {
      update(bid, { 
        progress: { 
          current: pageNumber, 
          total: numPages 
        } 
      });
    }
  }

  const handlePageChange = (newPage: number) => {
    const p = Math.max(1, Math.min(newPage, numPages));
    setPageNumber(p);
    update(bid, { 
      progress: { 
        current: p, 
        total: numPages 
      } 
    });
  };

  const captureSelection = () => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim().length > 0) {
      const existingNotes = localNotes || "";
      const newNotes = existingNotes 
        ? `${existingNotes}\n\n> ${selection.trim()}`
        : `> ${selection.trim()}`;
      
      setLocalNotes(newNotes);
      present({
        message: "Selection appended to notes!",
        duration: 2000,
        color: "success",
        position: "top"
      });
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle style={{ fontSize: '0.9rem' }}>{book?.title}</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              fill={showNotes ? "solid" : "outline"} 
              color={showNotes ? "primary" : "medium"}
              size="small" 
              onClick={() => setShowNotes(!showNotes)}
              style={{ margin: '0 8px' }}
            >
              <IonIcon slot="start" icon={documentTextOutline} />
              Notes
            </IonButton>
            <IonButton onClick={captureSelection} fill="outline" size="small" style={{ margin: '0 8px' }}>
              <IonIcon slot="start" icon={chatbubbleOutline} />
              Save Quote
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <div style={{ padding: '0 16px' }}>
          <IonProgressBar value={pageNumber / (numPages || 1)} color="primary" />
        </div>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#525659' }}>
        <div style={{ display: 'flex', minHeight: '100%', gap: '16px' }}>
          <div 
            style={{ flex: 1, display: 'flex', justifyContent: 'center', minHeight: '100%', overflowX: 'auto' }}
            onMouseUp={captureSelection}
          >
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
                  <IonSpinner name="crescent" />
                  <p>Downloading PDF...</p>
                  <p style={{ fontSize: '0.8rem', color: '#ccc' }}>If this takes too long, the publisher may be blocking the internal reader.</p>
                  <IonButton fill="clear" color="light" size="small" href={url} target="_blank">Open Externally</IonButton>
                </div>
              }
              error={
                <div style={{ color: 'white', textAlign: 'center', marginTop: '50px', padding: '20px' }}>
                  <IonIcon icon={bookmarkOutline} style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <h3>Internal Reader Blocked</h3>
                  <p>Most academic publishers (like Elsevier or Springer) block internal web readers due to strict security (CORS) policies.</p>
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <IonButton fill="solid" color="light" href={url} target="_blank">
                      Open in New Tab
                    </IonButton>
                    <IonButton fill="clear" color="light" onClick={onClose}>
                      Go Back
                    </IonButton>
                  </div>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                renderAnnotationLayer={true} 
                renderTextLayer={true}
                width={Math.min(window.innerWidth - (showNotes ? 360 : 40), 800)}
              />
            </Document>
          </div>
          
          {showNotes && (
            <div style={{ width: '320px', background: 'var(--ion-background-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Notes</h3>
                <IonIcon icon={closeOutline} onClick={() => setShowNotes(false)} style={{ cursor: 'pointer', fontSize: '1.2rem' }} />
              </div>
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                placeholder="Type your markdown notes here. Highlight text in the PDF and click 'Save Quote' to append."
                style={{
                  flex: 1,
                  width: '100%',
                  border: '1px solid var(--ion-border-color)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '0.9rem',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  background: 'var(--ion-color-step-50)'
                }}
              />
            </div>
          )}
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}>
            <IonButtons>
              <IonButton onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber <= 1}>
                <IonIcon icon={chevronBackOutline} />
              </IonButton>
            </IonButtons>
            
            <IonLabel>
              Page {pageNumber} of {numPages}
            </IonLabel>

            <IonButtons>
              <IonButton onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber >= numPages}>
                <IonIcon icon={chevronForwardOutline} />
              </IonButton>
            </IonButtons>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default PDFReader;