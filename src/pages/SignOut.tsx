import { IonButton, IonItem, IonList, IonCard } from "@ionic/react";
import React from "react";
import { auth } from "../api/firebase";
import { useNavigate } from "react-router-dom";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * This page is the confirmation displayed when a user signs out.
 * @constructor
 */
const SignOutPage: React.FC = () => {
  const props = { name: "Sign Out" };
  return (
    <Page {...props}>
      <CenterChild>
        <SignOut />
      </CenterChild>
    </Page>
  );
};

/**
 * When a user signs out they are taken back to the Sign In back.
 * Should they cancel at the confirmation, they are returned to the Explore.
 * @constructor
 */
const SignOut: React.FC = () => {
  const navigate = useNavigate();

  const back = () => {
    navigate("/page/Explore");
  };

  const signOut = () => {
    auth.signOut();
    navigate("/page/SignIn");
  };

  return (
    <IonCard style={{ maxWidth: '400px', width: '90%', padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👋</div>
      <h2 style={{ fontWeight: '800', margin: '0 0 10px', color: 'var(--ion-color-primary)' }}>Sign Out?</h2>
      <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '30px' }}>Are you sure you want to sign out of your research library?</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <IonButton expand="block" color="danger" onClick={signOut}>Yes, Sign Out</IonButton>
        <IonButton expand="block" fill="clear" color="medium" onClick={back}>Stay Signed In</IonButton>
      </div>
    </IonCard>
  );
};

export default SignOutPage;
