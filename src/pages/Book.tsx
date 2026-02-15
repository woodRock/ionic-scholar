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
import React, { useEffect, useState } from "react";
import { collection } from "../api/firebase";
import {useUser} from "../api/user";
import {Book} from "../api/library";
import {toList} from "../api/scholar";
import Page from "../components/Page";
import Citations from "../components/Citations";
import Keywords from "../components/Keywords";
import Notes from "../components/Notes";
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
  if (!book || !bid) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <IonText color="medium">Loading paper details...</IonText>
      </div>
    );
  }

  const { title, authors, year, url } = book;

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
          {url && (
            <IonButton fill="solid" shape="round" onClick={() => setReaderOpen(true)}>
              Read Paper
            </IonButton>
          )}
          <Citations book={book} bid={bid} text="Cite Paper" />
          <Progress book={book} bid={bid} />
        </div>

        {url && (
          <PDFReader 
            isOpen={readerOpen} 
            onClose={() => setReaderOpen(false)} 
            url={url} 
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
            <IonCardTitle style={{ fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <Notes book={book} bid={bid} />
          </IonCardContent>
        </IonCard>
      </div>
    </div>
  );
};

export default BookPage;