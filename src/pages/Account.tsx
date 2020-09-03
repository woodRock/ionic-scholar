import {IonAvatar, IonButton, IonIcon, IonImg, IonItem, IonLabel, IonList, IonText} from "@ionic/react";
import {mailOutline} from "ionicons/icons";
import React from "react";
import {useUser} from "../api/user";
import Page from "../components/Page";

/**
 * Displays basic account information to the user.
 * @constructor
 */
const AccountPage: React.FC = () => {
  const props = { name: "Account" };
  return (
    <Page {...props}>
      <Account />
    </Page>
  );
};

/**
 * Component requires the user context to access necessary information.
 * Displays there username, password and account photo.
 * Also provides password reset and sign out options.
 * @constructor React Functional Component
 */
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
