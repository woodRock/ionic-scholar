import {
  IonAvatar,
  IonButton,
  IonCard,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonInput,
  useIonToast
} from "@ionic/react";
import { mailOutline, keyOutline, saveOutline } from "ionicons/icons";
import React, { useState, useEffect } from "react";
import { useUser } from "../api/user";
import Page from "../components/Page";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { firestore } from "../api/firebase";

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
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsLoading] = useState(false);
  const [present] = useIonToast();

  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(firestore, `users/${user.uid}/settings/preferences`);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
      if (doc.exists()) {
        setApiKey(doc.data().ssApiKey || "");
      }
    });
    return () => unsubscribe();
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const settingsRef = doc(firestore, `users/${user.uid}/settings/preferences`);
      await setDoc(settingsRef, { ssApiKey: apiKey }, { merge: true });
      present({
        message: "Settings saved successfully",
        duration: 2000,
        color: "success",
      });
    } catch (err) {
      present({
        message: "Error saving settings",
        duration: 2000,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <IonCard style={{ padding: '30px', textAlign: 'center', margin: '0 0 24px 0', boxShadow: 'none', border: '1px solid var(--ion-border-color)', borderRadius: '16px' }}>
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

      <IonCard style={{ padding: '30px', margin: 0, boxShadow: 'none', border: '1px solid var(--ion-border-color)', borderRadius: '16px' }}>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--ion-color-step-400)', marginBottom: '8px' }}>API Integration</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--ion-color-step-600)', marginBottom: '20px' }}>
            Enter your Semantic Scholar API key for higher rate limits.
          </p>
          
          <div style={{ background: 'var(--ion-color-step-50)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ion-border-color)' }}>
            <IonInput
              type="password"
              placeholder="Semantic Scholar API Key"
              value={apiKey}
              onIonInput={e => setApiKey(e.detail.value!)}
              style={{ '--padding-start': '0' }}
            />
          </div>

          <IonButton 
            expand="block" 
            style={{ marginTop: '20px' }} 
            onClick={saveSettings}
            disabled={isSaving}
          >
            <IonIcon slot="start" icon={saveOutline} />
            Save API Key
          </IonButton>
          
          <p style={{ fontSize: '0.75rem', marginTop: '12px', color: 'var(--ion-color-step-500)', textAlign: 'center' }}>
            Get a free key at <a href="https://www.semanticscholar.org/product/api" target="_blank" rel="noreferrer">semanticscholar.org</a>
          </p>
        </div>
      </IonCard>
    </div>
  );
};

export default AccountPage;
