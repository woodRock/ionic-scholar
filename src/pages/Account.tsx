import {
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonText,
  IonButton,
  IonAvatar,
  IonImg
} from "@ionic/react";
import { mailOutline } from "ionicons/icons";
import React from "react";
import { useUser } from "../api/user";
import Page from "../components/Page";

const AccountPage: React.FC = () => {
  const props = { name: "Account" };
  return (
    <Page {...props}>
      <Account />
    </Page>
  );
};

const Account: React.FC = () => {
  const user = useUser();
  return (
    <IonList>
      <IonItem>
        <IonAvatar slot="start">
          <IonImg src={user.photoURL} alt="user profile" />
        </IonAvatar>
        <IonLabel>Username</IonLabel>
        <IonText>{user?.displayName}</IonText>
      </IonItem>
      <IonItem>
        <IonIcon slot="start" icon={mailOutline} />
        <IonLabel>Email</IonLabel>
        <IonText>{user?.email}</IonText>
      </IonItem>
      <IonButton slot="end" expand="full" routerLink="/page/Reset">
        Reset Password
      </IonButton>
      <IonButton expand="full" color="light" routerLink="/page/SignOut">
        Sign Out
      </IonButton>
    </IonList>
  );
};

export default AccountPage;
