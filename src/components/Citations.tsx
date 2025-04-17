import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonText,
  IonTitle,
} from "@ionic/react";
import CopyToClipboard from "react-copy-to-clipboard";
import { checkmarkDoneCircleOutline } from "ionicons/icons";
import React, { useState } from "react";
import { Book } from "../api/library";
import { cite } from "../api/scholar";

// Define component props
interface CitationsProps {
  children?: React.ReactNode;
  book: Book;
  bid?: string; // Keep for compatibility with other components
  text?: string;
}

/**
 * We generate a LaTeX citation for a paper here
 *
 * @param props Component properties
 * @param props.children Child components
 * @param props.book Book to generate a citation for
 * @param props.text Name of the button (this component is reused)
 */
const Citations: React.FC<CitationsProps> = ({ children, book, text }) => {
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);
  const citation = book ? cite(book) : "";

  const dismiss = () => {
    setShowCitations(false);
    setCopied(false);
  };

  return (
    <>
      <IonButton expand="full" onClick={() => setShowCitations(true)}>
        <IonLabel>{text ? text : "Show Citation"}</IonLabel>
      </IonButton>
      <IonPopover
        isOpen={showCitations}
        cssClass="my-custom-class"
        showBackdrop={true}
        onDidDismiss={dismiss}
      >
        {copied ? (
          <>
            <IonList>
              <IonTitle>Copied!</IonTitle>
              <IonItem>
                <IonText>
                  The citation has been copied to your clipboard.
                </IonText>
                <IonIcon
                  style={{ color: "green" }}
                  slot="end"
                  icon={checkmarkDoneCircleOutline}
                />
              </IonItem>
              <IonItem>
                <IonText style={{ color: "grey" }}>
                  Tap anywhere outside to dismiss...
                </IonText>
              </IonItem>
              <IonButton expand="full" onClick={() => setShowCitations(false)}>
                Back
              </IonButton>
            </IonList>
          </>
        ) : (
          <>
            <h1>Latex</h1>
            <pre> {citation}</pre>
            <CopyToClipboard text={citation} onCopy={() => setCopied(true)}>
              <IonButton expand="full">Copy</IonButton>
            </CopyToClipboard>
          </>
        )}
      </IonPopover>
    </>
  );
};

export default Citations;