import {
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonItemGroup,
  IonIcon,
  IonItemSliding,
  IonItemOption,
  IonItemOptions
} from "@ionic/react";
import React from "react";
import { libraryOutline, trashOutline } from "ionicons/icons";
import { v4 } from "uuid";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { toList } from "../api/scholar";

const LibraryPage = () => {
  const props = { name: "Library" };
  return (
    <Page {...props}>
      <Library />
    </Page>
  );
};

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
