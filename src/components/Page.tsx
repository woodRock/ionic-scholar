import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import React from "react";

// Define component props type
interface PageProps {
  children?: React.ReactNode;
  name?: string;
}

/**
 * A wrapper for child components.
 * Renders generic content required for each page.
 *
 * @param props Component properties
 * @param props.children to be rendered inside the Page
 * @param props.name of the page for the title
 */
const Page: React.FC<PageProps> = ({ children, name }) => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>{name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">{name}</IonTitle>
          </IonToolbar>
        </IonHeader>
        {children}
      </IonContent>
    </IonPage>
  );
};

export default Page;