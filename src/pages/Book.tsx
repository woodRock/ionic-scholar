import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonLabel,
  IonText,
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
import Quotes from "../components/Quotes";
import Progress from "../components/Progress";

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
  if (!book || !bid) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <IonText color="medium">Loading paper details...</IonText>
      </div>
    );
  }

  const { title, authors, year, url } = book;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <IonCard style={{ margin: '0 0 24px 0', padding: '10px' }}>
        <IonCardHeader>
          <IonCardSubtitle style={{ color: 'var(--ion-color-secondary)', fontSize: '1rem' }}>{year}</IonCardSubtitle>
          <IonCardTitle style={{ fontSize: '2rem', fontWeight: '800', lineHeight: '1.2' }}>{title}</IonCardTitle>
          <p style={{ fontSize: '1.1rem', color: 'var(--ion-color-step-600)', marginTop: '12px' }}>
            {toList(authors)}
          </p>
        </IonCardHeader>
        
        <IonCardContent>
          {book.description && (
            <div style={{ marginBottom: '20px', borderTop: '1px solid var(--ion-border-color)', paddingTop: '20px' }}>
              <IonText color="dark">
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Abstract</h3>
                <p style={{ lineHeight: '1.6', fontSize: '1.05rem', textAlign: 'justify' }}>{book.description}</p>
              </IonText>
            </div>
          )}
          {url && (
            <IonButton expand="block" fill="solid" href={url} target="_blank" style={{ marginTop: '10px' }}>
              <IonLabel>Read Original Paper</IonLabel>
            </IonButton>
          )}
        </IonCardContent>
      </IonCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <IonCard style={{ margin: 0 }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '1.2rem' }}>Research Progress</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <Progress book={book} bid={bid} />
            </IonCardContent>
          </IonCard>

          <IonCard style={{ margin: 0 }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '1.2rem' }}>Citation</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <Citations book={book} bid={bid} text="Generate BibTeX" />
            </IonCardContent>
          </IonCard>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <IonCard style={{ margin: 0 }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '1.2rem' }}>Keywords & Metadata</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <Keywords book={book} bid={bid} />
            </IonCardContent>
          </IonCard>

          <IonCard style={{ margin: 0 }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '1.2rem' }}>Important Quotes</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <Quotes book={book} bid={bid} />
            </IonCardContent>
          </IonCard>
        </div>
      </div>
    </div>
  );
};

export default BookPage;