import {IonButton, IonItem, IonLabel, IonList, IonText} from "@ionic/react";
import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {collection, DocumentSnapshot} from "../api/firebase";
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
  const user = useUser();
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
const BookItem: React.FC<BookItemProps> = ({ children, book, bid }) => {
  const { title, authors, year, url } = book || { 
    title: "", 
    authors: [], 
    year: 0, 
    url: "" 
  };

  const props = { book, bid };

  // Ensure book and bid are not undefined before rendering sub-components that require them
  const renderComponents = book && bid;

  return (
    <IonList>
      <IonItem>
        <IonLabel>Title</IonLabel>
        <IonText>{title}</IonText>
      </IonItem>
      <IonItem>
        <IonLabel>Year</IonLabel>
        <IonText>{year}</IonText>
      </IonItem>
      <IonItem>
        <IonLabel>Author</IonLabel>
        <IonText>{toList(authors)}</IonText>
      </IonItem>
      {renderComponents && (
        <>
          <Keywords book={book as Book} bid={bid as string} />
          <Quotes book={book as Book} bid={bid as string} />
          <Progress book={book as Book} bid={bid as string} />
          <Citations book={book as Book} bid={bid as string} />
        </>
      )}
      {url && (
        <IonButton expand="full" color="light" href={url}>
          <IonLabel>View</IonLabel>
        </IonButton>
      )}
    </IonList>
  );
};

export default BookPage;