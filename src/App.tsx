/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";

import React, { useEffect } from "react";
import { Redirect, Route, useHistory } from "react-router-dom";
import { IonApp, IonRouterOutlet, IonSplitPane } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import { useUser } from "./api/user";

// The pages for the application
import Menu from "./components/Menu";
import ExplorePage from "./pages/Explore";
import LibraryPage from "./pages/Library";
import AccountPage from "./pages/Account";
import BookPage from "./pages/Book";
import SignUpPage from "./pages/SignUp";
import SignOutPage from "./pages/SignOut";
import SignInPage from "./pages/SignIn";
import PasswordReset from "./pages/PasswordReset";

/**
 * This is the React functional component at the root of our DOM.
 * @constructor
 */
const App: React.FC = () => {
  const user = useUser();

  useEffect(() => {}, [user]);

  return (
    <IonApp>
      <IonReactRouter>
        {user ? <Authenticated /> : <NotAuthenticated />}
      </IonReactRouter>
    </IonApp>
  );
};

/**
 * These are the pages a user is who is not sign in has access to.
 * @constructor
 */
const NotAuthenticated: React.FC = () => {
  return (
    <IonRouterOutlet id="main">
      <Route path="/page/Reset" component={PasswordReset} />
      <Route path="/page/SignUp" component={SignUpPage} />
      <Route path="/page/SignIn" component={SignInPage} />
      <Redirect from="/" to="/page/SignIn" exact />
    </IonRouterOutlet>
  );
};

/**
 * One a user is authenticated, they have access to these pages
 * @constructor
 */
const Authenticated: React.FC = () => {
  let history = useHistory();

  // Once the user has signed in go to the home page.
  useEffect(() => {
    history.push("/page/Explore");
  }, [history]);

  return (
    <IonSplitPane contentId="main">
      <Menu />
      <IonRouterOutlet id="main">
        <Route path="/page/Explore" component={ExplorePage} />
        <Route path="/page/Library" component={LibraryPage} />
        <Route path="/page/Account" component={AccountPage} />
        <Route path="/page/Book/:id" component={BookPage} />
        <Route path="/page/Reset" component={PasswordReset} />
        <Route path="/page/SignOut" component={SignOutPage} />
        <Redirect from="/" to="/page/Explore" exact />
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default App;
