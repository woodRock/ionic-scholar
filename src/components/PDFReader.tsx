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
import { closeOutline, chevronBackOutline, chevronForwardOutline, chatbubbleOutline, bookmarkOutline } from 'ionicons/icons';
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
  const [, , , , , update] = useLibrary();
  const [present] = useIonToast();

  // Load existing progress
  useEffect(() => {
    if (book?.progress?.current) {
      setPageNumber(book.progress.current);
    }
  }, [book, isOpen]);

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
      const existingQuotes = book.quotes || [];
      if (!existingQuotes.includes(selection.trim())) {
        update(bid, { 
          quotes: [...existingQuotes, selection.trim()] 
        });
        present({
          message: "Quote saved to library!",
          duration: 2000,
          color: "success",
          position: "top"
        });
      }
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
        <div 
          style={{ display: 'flex', justifyContent: 'center', minHeight: '100%' }}
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
              width={Math.min(window.innerWidth - 40, 800)}
            />
          </Document>
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