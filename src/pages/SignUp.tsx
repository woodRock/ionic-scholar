import { IonList, IonItem, IonInput, IonButton } from "@ionic/react";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { auth, generateUserDocument } from "../api/firebase";
import { validation } from "../api/user";
import Page from "../components/Page";
import CenterChild from "../components/Center";

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

const SignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  const doSignUp = (event: any) => {
    const { valid, error } = validation(username, password1, password2, email);
    valid ? onSuccess(event) : setError(prev => error);
  };

  const createUserWithEmailAndPasswordHandler = async (event: any) => {
    event.preventDefault();
    try {
      const { user } = await auth.createUserWithEmailAndPassword(
        email,
        password1
      );
      generateUserDocument(user, { username });
    } catch (error) {
      setError("Error Signing up with email and password");
    }
  };

  const onSuccess = (event: any) => {
    setError("Success");
    createUserWithEmailAndPasswordHandler(event);
    history.push("/page/Explore");
    clear();
  };

  const clear = () => {
    setTimeout(() => {
      setEmail("");
      setUsername("");
      setPassword1("");
      setPassword2("");
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
          value={email}
          placeholder="email"
          onIonChange={e => setEmail(e.detail.value!)}
          clearInput
        ></IonInput>
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          value={username}
          placeholder="username"
          onIonChange={e => setUsername(e.detail.value!)}
          clearInput
        ></IonInput>
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          type="password"
          placeholder="Password"
          onIonChange={e => setPassword1(e.detail.value!)}
          value={password1}
        ></IonInput>
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          type="password"
          placeholder="Confirm your password"
          onIonChange={e => setPassword2(e.detail.value!)}
          value={password2}
        ></IonInput>
      </IonItem>
      <IonButton expand="full" onClick={doSignUp}>
        Sign Up
      </IonButton>
      <IonItem routerLink="/page/SignIn">
        Already have an account? <a>Sign In</a>
      </IonItem>
    </IonList>
  );
};

export default SignUpPage;
