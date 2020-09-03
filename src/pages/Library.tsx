import {
  IonIcon,
  IonItem,
  IonItemGroup,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonText,
} from "@ionic/react";
import React from "react";
import { libraryOutline, trashOutline } from "ionicons/icons";
import { v4 } from "uuid";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { toList } from "../api/scholar";

/**
 * The library is a collection of citations the user has bookmarked.
 * They can add keywords, quotes and track progress through their libraries contents.
 */
const LibraryPage = () => {
  const props = { name: "Library" };
  return (
    <Page {...props}>
      <Library />
    </Page>
  );
};

/**
 * The library relies on the library context.
 * This context updates upon snapshot changes on Firebase.
 * The library is reloaded to reflect those changes.
 */
const Library = () => {
  const [library] = useLibrary();
  return (
    <>
      <IonList>
        {library.map((book: any) => (
          <BookItem key={v4()} {...book} />
        ))}
      </IonList>
    </>
  );
};

/**
 * Controls how each book in the library is displayed.
 * @param book to display as list item
 * @constructor
 */
const BookItem = (book: any) => {
  const [, , , remove] = useLibrary();
  const { title, authors } = book;
  return (
    <IonItemSliding>
      <IonItem key={title} routerLink={"Book/" + title}>
        <IonIcon slot="start" icon={libraryOutline} />
        <IonItemGroup>
          <IonLabel>
            <strong>{title}</strong>
          </IonLabel>
          <IonText>{toList(authors)}</IonText>
        </IonItemGroup>
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption
          style={{ backgroundColor: "red" }}
          onClick={() => remove(title)}
        >
          <IonIcon slot="start" icon={trashOutline} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default LibraryPage;
