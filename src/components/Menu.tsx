import {
  libraryOutline,
  logOutOutline,
  searchOutline,
  settingsOutline,
} from "ionicons/icons";
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonMenu,
  IonMenuToggle,
  IonNote,
} from "@ionic/react";
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "../api/user";
import "../theme/Menu.css";

/**
 * This menu is displayed as a side panel on most pages.
 * It provides navigation for the user.
 * Depending on screen size it will automatically minimize.
 * @constructor
 */
const Menu = () => {
  const location = useLocation();
  const user = useUser();
  const { displayName } = user;

  useEffect(() => {}, []);

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <IonListHeader>Scholar</IonListHeader>
          <IonNote>{displayName}</IonNote>
          {appPages.map((appPage, index) => {
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  className={
                    location.pathname === appPage.url ? "selected" : ""
                  }
                  routerLink={appPage.url}
                  routerDirection="none"
                  lines="none"
                  detail={false}
                >
                  <IonIcon
                    slot="start"
                    ios={appPage.iosIcon}
                    md={appPage.mdIcon}
                  />
                  <IonLabel>{appPage.title}</IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

/**
 * Available pages on the menu
 */
const appPages: AppPage[] = [
  {
    title: "Explore",
    url: "/page/Explore",
    iosIcon: searchOutline,
    mdIcon: searchOutline,
  },
  {
    title: "Library",
    url: "/page/Library",
    iosIcon: libraryOutline,
    mdIcon: libraryOutline,
  },
  {
    title: "Account",
    url: "/page/Account",
    iosIcon: settingsOutline,
    mdIcon: settingsOutline,
  },
  {
    title: "Sign Out",
    url: "/page/SignOut",
    iosIcon: logOutOutline,
    mdIcon: logOutOutline,
  },
];

interface AppPage {
  url: string;
  iosIcon: string;
  mdIcon: string;
  title: string;
}

export default Menu;
