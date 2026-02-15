import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonLabel,
  IonText,
  IonBadge,
} from "@ionic/react";
import { useParams } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { collection } from "../api/firebase";
import {useUser} from "../api/user";
import {Book, useLibrary} from "../api/library";
import {toList} from "../api/scholar";
import { cloudUploadOutline, documentTextOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import Page from "../components/Page";
import Citations from "../components/Citations";
import Keywords from "../components/Keywords";
import Quotes from "../components/Quotes";
import Progress from "../components/Progress";
import PDFReader from "../components/PDFReader";

// Define component props
interface BookItemProps {
  children?: React.ReactNode;
  book?: Book;
  bid?: string;
}

/**
 * The component for representing an individual book.
 * It retrieves the book's id on firebase from the browser.
 * @constructor React Functional Component
 */
const BookPage: React.FC = () => {
  const [book, setBook] = useState<Book>();
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const [bookProps, setBookProps] = useState<BookItemProps>({ book: undefined, bid: "" });

  useEffect(() => {
    if (!user) return;

    // Set up real-time listener for the collection
    const unsubscribe = collection(user.uid).onSnapshot((snapshot) => {
      snapshot.forEach((doc) => {
        if (id === doc.data().title) {
          const bookData = doc.data() as Book;
          setBookProps({ book: bookData, bid: doc.id });
          setBook(bookData);
        }
      });
    });

    // Clean up listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [id, user]);

  return (
    <Page name="Book">
      <BookItem {...bookProps} />
    </Page>
  );
};

/**
 * This component displays the meta-data for the book.
 * It calls the subcomponents necessary to track progress.
 * @param props - Component props including book and bid
 * @constructor - React Functional Component
 */
const BookItem: React.FC<BookItemProps> = ({ book, bid }) => {
  const [readerOpen, setReaderOpen] = useState(false);
  const [, , , , , , , , , uploadPDF] = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!book || !bid) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <IonText color="medium">Loading paper details...</IonText>
      </div>
    );
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !bid) return;

    setIsUploading(true);
    try {
      await uploadPDF(bid, file);
      console.log("PDF uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const { title, authors, year, url, pdf } = book;
  const pdfUrl = pdf && pdf.startsWith('http') && pdf.includes('firebasestorage') ? pdf : url;
  const hasPDF = pdf && pdf.startsWith('http') && pdf.includes('firebasestorage');

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '40px' }}>
        <IonText color="medium" style={{ fontSize: '0.9rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {year}
        </IonText>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', lineHeight: '1.2', margin: '8px 0 16px', color: 'var(--ion-color-dark)' }}>
          {title}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--ion-color-step-600)', lineHeight: '1.5', marginBottom: '12px' }}>
          {toList(authors)}
        </p>
        
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <IonBadge color="light">{book.numCitations || 0} Citations</IonBadge>
          {book.publication && <IonBadge color="secondary">{book.publication}</IonBadge>}
        </div>
        
        {/* Cardless Keywords */}
        <div style={{ marginBottom: '24px' }}>
          <Keywords book={book} bid={bid} />
        </div>

        {/* Unified Action Bar */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {(pdfUrl) && (
            <IonButton fill="solid" shape="round" onClick={() => setReaderOpen(true)}>
              <IonIcon slot="start" icon={documentTextOutline} />
              {hasPDF ? "Read PDF" : "View Source"}
            </IonButton>
          )}

          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <IonButton 
            fill="outline" 
            shape="round" 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <IonIcon slot="start" icon={cloudUploadOutline} />
            {isUploading ? "Uploading..." : (hasPDF ? "Replace PDF" : "Upload PDF")}
          </IonButton>

          <Citations book={book} bid={bid} text="Cite Paper" />
          <Progress book={book} bid={bid} />
        </div>

        {pdfUrl && (
          <PDFReader 
            isOpen={readerOpen} 
            onClose={() => setReaderOpen(false)} 
            url={pdfUrl} 
            book={book} 
            bid={bid} 
          />
        )}
      </div>

      {/* Full Width Abstract Section */}
      {book.description && (
        <IonCard style={{ margin: '0 0 32px 0', boxShadow: 'none', border: '1px solid var(--ion-border-color)', borderRadius: '16px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abstract</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--ion-color-step-800)', textAlign: 'justify' }}>
              {book.description}
            </p>
          </IonCardContent>
        </IonCard>
      )}

      {/* Secondary Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <IonCard style={{ margin: 0, boxShadow: 'none', border: '1px solid var(--ion-border-color)', borderRadius: '16px' }}>
          <IonCardHeader>
            <IonCardTitle style={{ fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Quotes</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <Quotes book={book} bid={bid} />
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default BookPage;