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
import { Navigate, Route, useNavigate, BrowserRouter as Router, Routes } from "react-router-dom";
import { IonApp, IonRouterOutlet, IonSplitPane, IonSpinner, setupIonicReact } from "@ionic/react";

import { useUser } from "./api/user";

// The pages for the application
import Menu from "./components/Menu";
import ExplorePage from "./pages/Explore";
import LibraryPage from "./pages/Library";
import DiscoverPage from "./pages/Discover";
import ReadPage from "./pages/Read";
import NetworkMapPage from "./pages/NetworkMap";
import ChatPage from "./pages/Chat";
import AccountPage from "./pages/Account";
import BookPage from "./pages/Book";
import TaggingWizard from "./pages/TaggingWizard";
import SignUpPage from "./pages/SignUp";
import SignOutPage from "./pages/SignOut";
import SignInPage from "./pages/SignIn";
import PasswordReset from "./pages/PasswordReset";

setupIonicReact();

/**
 * This is the React functional component at the root of our DOM.
 * @constructor
 */
const App: React.FC = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <IonApp>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'var(--ion-background-color)'
        }}>
          <IonSpinner name="crescent" color="primary" />
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <Router>
        {user ? <Authenticated /> : <NotAuthenticated />}
      </Router>
    </IonApp>
  );
};

const NotAuthenticated: React.FC = () => {
  return (
    <IonRouterOutlet id="main">
      <Routes>
        <Route path="/page/Reset" element={<PasswordReset />} />
        <Route path="/page/SignUp" element={<SignUpPage />} />
        <Route path="/page/SignIn" element={<SignInPage />} />
        <Route path="/" element={<Navigate to="/page/SignIn" replace />} />
        <Route path="*" element={<Navigate to="/page/SignIn" replace />} />
      </Routes>
    </IonRouterOutlet>
  );
};

const Authenticated: React.FC = () => {
  return (
    <IonSplitPane contentId="main">
      <Menu />
      <IonRouterOutlet id="main">
        <Routes>
          <Route path="/page/Explore" element={<ExplorePage />} />
          <Route path="/page/Library" element={<LibraryPage />} />
          <Route path="/page/Discover" element={<DiscoverPage />} />
          <Route path="/page/Read" element={<ReadPage />} />
          <Route path="/page/NetworkMap" element={<NetworkMapPage />} />
          <Route path="/page/Chat" element={<ChatPage />} />
          <Route path="/page/Account" element={<AccountPage />} />
          <Route path="/page/Book/:id" element={<BookPage />} />
          <Route path="/page/TaggingWizard" element={<TaggingWizard />} />
          <Route path="/page/Reset" element={<PasswordReset />} />
          <Route path="/page/SignOut" element={<SignOutPage />} />
          <Route path="/" element={<Navigate to="/page/Explore" replace />} />
          <Route path="*" element={<Navigate to="/page/Explore" replace />} />
        </Routes>
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default App;
