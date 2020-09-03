import { IonLabel, IonText, IonList, IonItem, IonButton } from "@ionic/react";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { collection } from "../api/firebase";
import { useUser } from "../api/user";
import { Book } from "../api/library";
import { toList } from "../api/scholar";
import Page from "../components/Page";
import Citations from "../components/Citations";
import Keywords from "../components/Keywords";
import Quotes from "../components/Quotes";
import Progress from "../components/Progress";

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

type Props = {
  children?: React.ReactNode;
  book?: Book;
  bid?: string;
};

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

export default BookPage;
