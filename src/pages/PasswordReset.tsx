import React, { useState } from "react";
import { IonButton, IonInput, IonItem, IonLabel, IonList } from "@ionic/react";
import { auth } from "../api/firebase";
import { useHistory } from "react-router-dom";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * The use can reset their password at Sign In or Account.
 * Users can regain access to their account should they forget their password.
 * Or users can update their existing password due to security concerns.
 * @constructor
 */
const PasswordReset = () => {
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
const Reset = () => {
  const [email, setEmail] = useState("");
  const [emailHasBeenSent, setEmailHasBeenSent] = useState(false);
  const [error, setError] = useState("");
  let history = useHistory();

  const sendResetEmail = () => {
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

  if (emailHasBeenSent) {
    return <Success />;
  }

  return (
    <IonList>
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
        onClick={() => history.push("/page/SignIn")}
      >
        Sign In
      </IonButton>
    </IonList>
  );
};

/**
 * Once the user enters a valid email address they are taken here.
 * @constructor
 */
const Success = () => {
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
