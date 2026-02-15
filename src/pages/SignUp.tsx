import { IonButton, IonInput, IonItem, IonList, IonLabel, IonCard } from "@ionic/react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, generateUserDocument } from "../api/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { validation } from "../api/user";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * This page allows a user to sign up using an email or password.
 * @constructor
 */
const SignUpPage: React.FC = () => {
  const props = { name: "Sign Up" };
  return (
    <Page {...props}>
      <CenterChild>
        <SignUp />
      </CenterChild>
    </Page>
  );
};

/**
 * The sign up page has context sensitive error messages.
 * It is also used to generate a user document on Firebase.
 * @constructor
 */
const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const doSignUp = async (event: React.MouseEvent) => {
    event.preventDefault();
    const { valid, error: validationError } = validation(username, password1, password2, email);
    
    if (!valid) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password1);
      await generateUserDocument(userCredential.user, { username });
      navigate("/page/Explore");
    } catch (error: any) {
      setError(error.message || "Error Signing up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonCard style={{ maxWidth: '450px', width: '90%', padding: '30px', borderRadius: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.75rem', margin: '0', color: 'var(--ion-color-primary)' }}>Create Account</h2>
        <p style={{ color: 'var(--ion-color-step-600)', marginTop: '8px' }}>Join the community of researchers</p>
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
            value={username}
            placeholder="Username"
            onIonChange={(e) => setUsername(e.detail.value!)}
          />
        </IonItem>
        <IonItem style={{ '--background': 'var(--ion-color-step-50)', borderRadius: '8px', marginBottom: '12px' }}>
          <IonInput
            value={email}
            type="email"
            placeholder="Email Address"
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonItem style={{ '--background': 'var(--ion-color-step-50)', borderRadius: '8px', marginBottom: '12px' }}>
          <IonInput
            type="password"
            placeholder="Password"
            onIonChange={(e) => setPassword1(e.detail.value!)}
          />
        </IonItem>
        <IonItem style={{ '--background': 'var(--ion-color-step-50)', borderRadius: '8px', marginBottom: '24px' }}>
          <IonInput
            type="password"
            placeholder="Confirm Password"
            onIonChange={(e) => setPassword2(e.detail.value!)}
          />
        </IonItem>
      </IonList>

      <IonButton expand="block" onClick={doSignUp} disabled={isLoading} style={{ marginBottom: '20px' }}>
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </IonButton>

      <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
        <p style={{ color: 'var(--ion-color-step-600)' }}>
          Already have an account? <a onClick={() => navigate("/page/SignIn")} style={{ color: 'var(--ion-color-primary)', fontWeight: '600', cursor: 'pointer' }}>Log In</a>
        </p>
      </div>
    </IonCard>
  );
};

export default SignUpPage;