import { IonButton, IonInput, IonItem, IonList } from "@ionic/react";
import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { auth, generateUserDocument } from "../api/firebase";
import { validation } from "../api/user";
import Page from "../components/Page";
import CenterChild from "../components/Center";

/**
 * This page allows a user to sign up using an email or password.
 * @constructor
 */
const SignUpPage = () => {
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
const SignUp = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  const doSignUp = (event: any) => {
    const { valid, error } = validation(username, password1, password2, email);
    valid ? onSuccess(event) : setError(error);
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
          onIonChange={(e) => setEmail(e.detail.value!)}
          clearInput
        />
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          value={username}
          placeholder="username"
          onIonChange={(e) => setUsername(e.detail.value!)}
          clearInput
        />
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          type="password"
          placeholder="Password"
          onIonChange={(e) => setPassword1(e.detail.value!)}
          value={password1}
        />
      </IonItem>
      <IonItem style={{ flex: 1 }}>
        <IonInput
          type="password"
          placeholder="Confirm your password"
          onIonChange={(e) => setPassword2(e.detail.value!)}
          value={password2}
        />
      </IonItem>
      <IonButton expand="full" onClick={doSignUp}>
        Sign Up
      </IonButton>
      <IonItem routerLink="/page/SignIn">
        Already have an account? <a href="#">Sign In</a>
      </IonItem>
    </IonList>
  );
};

export default SignUpPage;
