import {
  IonList,
  IonItem,
  IonInput,
  IonLabel,
  IonButton,
  IonIcon
} from "@ionic/react";
import { logoGoogle } from "ionicons/icons";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useUser } from "../api/user";
import { auth, signInWithGoogle } from "../api/firebase";
import Page from "../components/Page";
import CenterChild from "../components/Center";

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

const SignIn: React.FC = props => {
  // TODO deprecated remove this
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const user = useUser();

  const doSignIn = (event: any) => {
    setError(""); // Clear the previous errors
    signInWithEmailAndPasswordHandler(event);
    onSuccess();
  };

  const doGoogle = (event: any) => {
    setError(""); // Clear the previous errors
    signInWithGoogle();
    onSuccess();
  };

  const signInWithEmailAndPasswordHandler = (event: any) => {
    auth.signInWithEmailAndPassword(email, password).catch(error => {
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
      // Waits for the next page to be loaded
      setPassword("");
      setError(""); // and their errors
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
          onIonChange={e => setEmail(e.detail.value!)}
          value={email}
        ></IonInput>
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          type="password"
          placeholder="Password"
          onIonChange={e => setPassword(e.detail.value!)}
          value={password}
        ></IonInput>
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
        <IonLabel>Don't have an account?</IonLabel> <a> Sign Up</a>
      </IonItem>
    </IonList>
  );
};

export default SignInPage;
