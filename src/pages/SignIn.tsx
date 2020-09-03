import {
  IonButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
} from "@ionic/react";
import { logoGoogle } from "ionicons/icons";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useUser } from "../api/user";
import { auth, signInWithGoogle } from "../api/firebase";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * User authentication with email/password or Google account is provided.
 * @constructor
 */
const SignInPage = () => {
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
const SignIn = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const user = useUser();

  const doSignIn = () => {
    setError(""); // Clear the previous errors
    signInWithEmailAndPasswordHandler();
    onSuccess();
  };

  const doGoogle = () => {
    setError(""); // Clear the previous errors
    signInWithGoogle();
    onSuccess();
  };

  const signInWithEmailAndPasswordHandler = () => {
    auth.signInWithEmailAndPassword(email, password).catch((error) => {
      setError(error.message);
      console.log(error);
    });
  };

  const onSuccess = () => {
    if (user) {
      setError("Success");
      history.push("/page/Explore");
      clear();
    }
  };

  const clear = () => {
    setTimeout(() => {
      setPassword("");
      setError("");
    }, 1000);
  };

  const messageColor = error === "Success" ? "green" : "red";

  return (
    <IonList>
      {error ? (
        <IonItem style={{ color: messageColor }}>{error}</IonItem>
      ) : null}
      <IonItem style={{ flex: 1 }}>
        <IonInput
          placeholder="Email"
          onIonChange={(e) => setEmail(e.detail.value!)}
          value={email}
        />
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          type="password"
          placeholder="Password"
          onIonChange={(e) => setPassword(e.detail.value!)}
          value={password}
        />
      </IonItem>
      <IonItem routerLink="/page/Reset">
        <a>Forgot password?</a>
      </IonItem>
      <IonButton expand="full" onClick={doSignIn}>
        Sign In
      </IonButton>
      <IonButton expand="full" color="light" onClick={doGoogle}>
        Sign In with Google
        <IonIcon slot="end" icon={logoGoogle} />
      </IonButton>
      <IonItem routerLink="/page/SignUp">
        {" "}
        <IonLabel>Don't have an account?</IonLabel> <a href="#"> Sign Up</a>
      </IonItem>
    </IonList>
  );
};

export default SignInPage;
