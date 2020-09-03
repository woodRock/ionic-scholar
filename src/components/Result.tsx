import {
  IonIcon,
  IonItemSliding,
  IonItem,
  IonItemGroup,
  IonLabel,
  IonText,
  IonItemOptions,
  IonItemOption,
  IonPopover
} from "@ionic/react";
import React, { useState } from "react";
import { libraryOutline, addOutline, documentOutline } from "ionicons/icons";
import { Book, useLibrary } from "../api/library";
import { toList, cite } from "../api/scholar";
import Citations from "./Citations";

const Result = (book: Book) => {
  const { title, year, authors, url } = book;
  const [, , add, ,] = useLibrary();
  const [showCitations, setShowCitations] = useState(false);

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
