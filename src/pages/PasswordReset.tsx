import React, { useState } from "react";
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonCard } from "@ionic/react";
import { auth } from "../api/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * The use can reset their password at Sign In or Account.
 * Users can regain access to their account should they forget their password.
 * Or users can update their existing password due to security concerns.
 * @constructor
 */
const PasswordReset: React.FC = () => {
  const props = { name: "Reset Password" };
  return (
    <Page {...props}>
      <CenterChild>
        <Reset />
      </CenterChild>
    </Page>
  );
};

/**
 * The component asks for the users email address associated with the account.
 * It provides a context sensitive error message for invalid emails.
 * If valid the user is taken to a confirmation page saying an email has been sent.
 * @constructor
 */
const Reset: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailHasBeenSent, setEmailHasBeenSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const sendResetEmail = async () => {
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setIsLoading(true);
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailHasBeenSent(true);
    } catch (err: any) {
      setError("Error resetting password. Check your email address.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailHasBeenSent) {
    return (
      <IonCard style={{ maxWidth: '400px', width: '90%', padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📧</div>
        <h2 style={{ fontWeight: '800', margin: '0 0 10px', color: 'var(--ion-color-primary)' }}>Email Sent!</h2>
        <p style={{ color: 'var(--ion-color-step-600)', marginBottom: '30px' }}>Check your inbox for instructions to reset your password.</p>
        <IonButton expand="block" onClick={() => navigate("/page/SignIn")}>Return to Login</IonButton>
      </IonCard>
    );
  }

  return (
    <IonCard style={{ maxWidth: '400px', width: '90%', padding: '30px', borderRadius: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.75rem', margin: '0', color: 'var(--ion-color-primary)' }}>Reset Password</h2>
        <p style={{ color: 'var(--ion-color-step-600)', marginTop: '8px' }}>Enter your email to receive a reset link</p>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <IonList lines="none">
        <IonItem style={{ '--background': 'var(--ion-color-step-50)', borderRadius: '8px', marginBottom: '24px' }}>
          <IonInput
            type="email"
            value={email}
            placeholder="Email Address"
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
      </IonList>

      <IonButton expand="block" onClick={sendResetEmail} disabled={isLoading} style={{ marginBottom: '16px' }}>
        {isLoading ? 'Sending...' : 'Send Reset Link'}
      </IonButton>

      <IonButton expand="block" fill="clear" onClick={() => navigate("/page/SignIn")} color="medium">
        Back to Login
      </IonButton>
    </IonCard>
  );
};

/**
 * Once the user enters a valid email address they are taken here.
 * @constructor
 */
const Success: React.FC = () => {
  return (
    <IonList>
      <IonItem style={{ color: "green" }}>
        An email has been sent to you!
      </IonItem>
      <IonButton expand="full" routerLink="/page/Explore">
        Back Home
      </IonButton>
    </IonList>
  );
};

export default PasswordReset;