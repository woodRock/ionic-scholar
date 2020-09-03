import { IonButton, IonItem, IonList } from "@ionic/react";
import React from "react";
import { auth } from "../api/firebase";
import { useHistory } from "react-router-dom";
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
  const history = useHistory();

  const back = () => {
    history.push("/page/Explore");
  };

  const signOut = () => {
    auth.signOut();
    history.push("/page/SignIn");
  };

  return (
    <IonList>
      <IonItem>
        <p>Are you sure you want to sign out?</p>
      </IonItem>
      <IonButton expand="full" onClick={signOut}>
        Yes
      </IonButton>
      <IonButton expand="full" color="light" onClick={back}>
        Cancel
      </IonButton>
    </IonList>
  );
};

export default SignOutPage;
