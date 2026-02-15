import {IonAvatar, IonButton, IonCard, IonIcon, IonImg, IonItem, IonLabel, IonList, IonText} from "@ionic/react";
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
  const { user } = useUser();
  if (!user) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <IonCard style={{ padding: '30px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IonAvatar style={{ width: '120px', height: '120px', marginBottom: '20px', border: '4px solid var(--ion-color-primary-tint)' }}>
            <IonImg src={user.photoURL || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt="user profile" />
          </IonAvatar>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: '0' }}>{user?.displayName || 'Scholar User'}</h2>
          <p style={{ color: 'var(--ion-color-step-600)', margin: '4px 0 20px' }}>{user?.email}</p>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--ion-border-color)', margin: '20px 0' }}></div>

        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ion-color-step-400)', marginBottom: '16px' }}>Account Settings</h3>
          <IonList lines="full">
            <IonItem routerLink="/page/Reset" button detail={true} style={{ '--padding-start': '0' }}>
              <IonIcon slot="start" icon={mailOutline} color="primary" />
              <IonLabel>Reset Password</IonLabel>
            </IonItem>
          </IonList>
        </div>

        <div style={{ marginTop: '30px' }}>
          <IonButton expand="block" color="danger" fill="outline" routerLink="/page/SignOut">
            Sign Out
          </IonButton>
        </div>
      </IonCard>
    </div>
  );
};

export default AccountPage;
