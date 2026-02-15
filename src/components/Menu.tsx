import {
  libraryOutline,
  logOutOutline,
  searchOutline,
  settingsOutline,
  sparklesOutline,
  bookOutline,
  shareSocialOutline,
  chatbubblesOutline,
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
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user } = useUser();
  const displayName = user?.displayName || "Research Assistant";

  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--ion-border-color)' }}>
          <h2 style={{ margin: 0, fontWeight: 800, color: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IonIcon icon={libraryOutline} />
            Scholar
          </h2>
          <IonNote style={{ fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{displayName}</IonNote>
        </div>
        
        <IonList id="inbox-list" style={{ padding: '12px' }}>
          {appPages.map((appPage, index) => {
            const isSelected = location.pathname === appPage.url;
            return (
              <IonMenuToggle key={index} autoHide={false}>
                <IonItem
                  className={isSelected ? "selected" : ""}
                  onClick={() => navigate(appPage.url)}
                  button
                  lines="none"
                  detail={false}
                  style={{
                    '--background': isSelected ? 'var(--ion-color-primary-tint)' : 'transparent',
                    '--color': isSelected ? 'var(--ion-color-primary)' : 'var(--ion-text-color)',
                    borderRadius: '8px',
                    marginBottom: '4px'
                  }}
                >
                  <IonIcon
                    slot="start"
                    ios={appPage.iosIcon}
                    md={appPage.mdIcon}
                    style={{ color: isSelected ? 'var(--ion-color-primary)' : 'inherit' }}
                  />
                  <IonLabel style={{ fontWeight: isSelected ? '600' : '400' }}>{appPage.title}</IonLabel>
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
    title: "Discover",
    url: "/page/Discover",
    iosIcon: sparklesOutline,
    mdIcon: sparklesOutline,
  },
  {
    title: "Read",
    url: "/page/Read",
    iosIcon: bookOutline,
    mdIcon: bookOutline,
  },
  {
    title: "Library",
    url: "/page/Library",
    iosIcon: libraryOutline,
    mdIcon: libraryOutline,
  },
  {
    title: "Assistant",
    url: "/page/Chat",
    iosIcon: chatbubblesOutline,
    mdIcon: chatbubblesOutline,
  },
  {
    title: "Research Map",
    url: "/page/NetworkMap",
    iosIcon: shareSocialOutline,
    mdIcon: shareSocialOutline,
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
