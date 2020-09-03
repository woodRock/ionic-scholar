import React, { useState } from "react";
import { IonItem, IonInput, IonButton, IonLabel, IonList } from "@ionic/react";
import { auth } from "../api/firebase";
import { useHistory } from "react-router-dom";
import Page from "../components/Page";
import CenterChild from "../components/Center";

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

const Reset: React.FC = () => {
  const [email, setEmail] = useState("");
  const [emailHasBeenSent, setEmailHasBeenSent] = useState(false);
  const [error, setError] = useState("");
  let history = useHistory();

  const sendResetEmail = (event: any) => {
    setError("");
    auth
      .sendPasswordResetEmail(email)
      .then(() => {
        setEmailHasBeenSent(true);
        setTimeout(() => {
          setEmailHasBeenSent(false);
        }, 3000);
      })
      .catch(() => {
        setError("Error resetting password");
      });
  };

  return (
    <IonList>
      {emailHasBeenSent ? (
        <>
          <IonItem style={{ color: "green" }}>
            An email has been sent to you!
          </IonItem>
          <IonButton expand="full" routerLink="/page/Explore">
            Back Home
          </IonButton>
        </>
      ) : (
        <>
          <IonLabel>Enter the email associated with your account.</IonLabel>
          {error ? <IonItem style={{ color: "red" }}>{error}</IonItem> : null}

          <IonInput
            type="email"
            value={email}
            placeholder="Email"
            onIonChange={(e: any) => setEmail(e.detail.value!)}
          />
          <IonButton expand="full" onClick={sendResetEmail}>
            Continue
          </IonButton>
          <IonButton
            expand="full"
            color="light"
            onClick={e => history.push("/page/SignIn")}
          >
            Sign In
          </IonButton>
        </>
      )}
    </IonList>
  );
};

export default PasswordReset;
