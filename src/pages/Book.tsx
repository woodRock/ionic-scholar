import {IonButton, IonItem, IonLabel, IonList, IonText} from "@ionic/react";
import {useParams} from "react-router-dom";
import React, {useEffect, useState} from "react";
import {collection} from "../api/firebase";
import {useUser} from "../api/user";
import {Book} from "../api/library";
import {toList} from "../api/scholar";
import Page from "../components/Page";
import Citations from "../components/Citations";
import Keywords from "../components/Keywords";
import Quotes from "../components/Quotes";
import Progress from "../components/Progress";

/**
 * The component for representing an individual book.
 * It retrieves the book's id on firebase from the browser.
 * @constructor React Functional Component
 */
const BookPage: React.FC = () => {
  const [book, setBook] = useState<Book>();
  const user = useUser();
  const { id } = useParams();
  const [bid] = useState("");
  const props = { name: "Book", bid: bid };
  const [bookProps, setBookProps] = useState<any>({ book: book, bid: "" });

  useEffect(() => {
    const unsubscribe = collection(user.uid).onSnapshot(snapshot =>
      snapshot.forEach(doc => {
        if (id === doc.data().title) {
          const b = doc.data() as Book;
          setBookProps({ book: b, bid: doc.id });
          setBook(b);
        }
      })
    );
    return unsubscribe;
  }, [id, user.uid]);

  return (
    <Page {...props}>
      <BookItem {...bookProps}> </BookItem>
    </Page>
  );
};

/**
 * This component displays the meta-data for the book.
 * It calls the subcomponents necessary to track progress.
 * @param children
 * @param book - The book to be summarized
 * @param bid - Firebase ID for the book document
 * @constructor - React Functional Component
 */
const BookItem: React.FC = ({ children, book, bid }: Props) => {
  const { title, authors, year, url } = book
    ? book
    : { title: "test", authors: [], year: "", url: "" };

  const props = { book: book, bid: bid };

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
      <Keywords {...props}> </Keywords>
      <Quotes {...props}> </Quotes>
      <Progress {...props}> </Progress>
      <Citations {...props}> </Citations>
      <IonButton expand="full" color="light" href={url}>
        <IonLabel>View</IonLabel>
      </IonButton>
    </IonList>
  );
};

type Props = {
    children?: React.ReactNode;
    book?: Book;
    bid?: string;
};

export default BookPage;
