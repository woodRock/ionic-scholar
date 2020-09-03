import {
  IonIcon,
  IonItem,
  IonItemGroup,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonText,
} from "@ionic/react";
import React from "react";
import { addOutline, documentOutline, libraryOutline } from "ionicons/icons";
import { Book, useLibrary } from "../api/library";
import { toList } from "../api/scholar";
import Citations from "./Citations";

/**
 * The component for each search result on explore.
 * We can add a search result to our library.
 *
 * @param book to be displayed
 * @constructor
 */
const Result = (book: Book) => {
  const { title, year, authors, url } = book;
  const [, , add, ,] = useLibrary();

  const props = { book: book, text: `''` };

  return (
    <IonItemSliding>
      <IonItem>
        <IonIcon slot="start" icon={libraryOutline} />
        <IonItemGroup>
          <IonLabel>
            <strong>{title}</strong> {year}
          </IonLabel>
          <IonText>{toList(authors)}</IonText>
        </IonItemGroup>
      </IonItem>
      <IonItemOptions side="end">
        <IonItemOption color="dark">
          <Citations {...props}> </Citations>
        </IonItemOption>
        <IonItemOption color="dark" href={url}>
          <IonIcon slot="start" icon={documentOutline} />
        </IonItemOption>
        <IonItemOption color="dark" onClick={() => add(book)}>
          <IonIcon slot="start" icon={addOutline} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default Result;
