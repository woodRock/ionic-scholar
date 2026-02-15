import {
  IonButton,
  IonCard,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
} from "@ionic/react";
import { logoGoogle } from "ionicons/icons";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../api/user";
import { auth, signInWithGoogle } from "../api/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * User authentication with email/password or Google account is provided.
 * @constructor
 */
const SignInPage: React.FC = () => {
  const props = { name: "Sign In" };
  return (
    <Page {...props}>
      <CenterChild>
        <SignIn />
      </CenterChild>
    </Page>
  );
};

/**
 * This Sign In page allows the user to authenticate their account.
 * It provides context sensitive error messages.
 * Upon success a user is redirected to the Explore page.
 * We provide navigation to Sign Up and Forgot Password from here.
 * @constructor
 */
const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const doSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError("");
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/page/Explore");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const doGoogle = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate("/page/Explore");
    } catch (error: any) {
      setError("Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonCard style={{ maxWidth: '400px', width: '90%', padding: '20px', borderRadius: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.75rem', margin: '0', color: 'var(--ion-color-primary)' }}>Welcome Back</h2>
        <p style={{ color: 'var(--ion-color-step-600)', marginTop: '8px' }}>Log in to your research library</p>
      </div>

      {error && (
        <div style={{ 
          background: 'var(--ion-color-danger-tint, #fee2e2)', 
          color: 'var(--ion-color-danger, #b91c1c)', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <IonList lines="none">
        <IonItem style={{ '--background': 'var(--ion-color-step-50)', borderRadius: '8px', marginBottom: '12px' }}>
          <IonInput
            placeholder="Email"
            type="email"
            onIonChange={(e) => setEmail(e.detail.value!)}
            value={email}
          />
        </IonItem>
        <IonItem style={{ '--background': 'var(--ion-color-step-50)', borderRadius: '8px', marginBottom: '20px' }}>
          <IonInput
            type="password"
            placeholder="Password"
            onIonChange={(e) => setPassword(e.detail.value!)}
            value={password}
          />
        </IonItem>
      </IonList>

      <IonButton expand="block" onClick={doSignIn} disabled={isLoading} style={{ marginBottom: '12px', '--box-shadow': 'none' }}>
        {isLoading ? 'Signing In...' : 'Sign In'}
      </IonButton>

      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--ion-color-step-400)' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--ion-border-color)' }}></div>
        <span style={{ padding: '0 10px', fontSize: '0.8rem' }}>OR</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--ion-border-color)' }}></div>
      </div>

      <IonButton expand="block" color="light" fill="outline" onClick={doGoogle} disabled={isLoading} style={{ marginBottom: '20px' }}>
        <IonIcon slot="start" icon={logoGoogle} />
        Continue with Google
      </IonButton>

      <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
        <p style={{ color: 'var(--ion-color-step-600)' }}>
          Don&apos;t have an account? <a onClick={() => navigate("/page/SignUp")} style={{ color: 'var(--ion-color-primary)', fontWeight: '600', cursor: 'pointer' }}>Sign Up</a>
        </p>
        <a onClick={() => navigate("/page/Reset")} style={{ color: 'var(--ion-color-step-500)', fontSize: '0.8rem', cursor: 'pointer' }}>Forgot password?</a>
      </div>
    </IonCard>
  );
};

export default SignInPage;