import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import React from "react";
import { addOutline, documentOutline, checkmarkOutline } from "ionicons/icons";
import { Book, useLibrary } from "../api/library";
import { toList } from "../api/scholar";
import Citations from "./Citations";

/**
 * The component for each search result on explore.
 * We can add a search result to our library.
 */
const Result = (book: Book) => {
  const { title, year, authors, url } = book;
  const [library, , add] = useLibrary();
  
  const isSaved = library.some((b: Book) => b.title === title);

  return (
    <IonCard style={{ marginBottom: '16px', border: '1px solid var(--ion-border-color, transparent)' }}>
      <IonCardHeader>
        <IonCardSubtitle style={{ color: 'var(--ion-color-secondary)' }}>{year}</IonCardSubtitle>
        <IonCardTitle style={{ fontSize: '1.25rem', fontWeight: '700' }}>{title}</IonCardTitle>
        <IonLabel color="medium" style={{ fontSize: '0.9rem' }}>{toList(authors)}</IonLabel>
      </IonCardHeader>
      
      <IonCardContent>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          <IonButton 
            fill={isSaved ? "solid" : "outline"} 
            color={isSaved ? "success" : "primary"}
            size="small" 
            onClick={() => !isSaved && add(book)}
            disabled={isSaved}
          >
            <IonIcon slot="start" icon={isSaved ? checkmarkOutline : addOutline} />
            {isSaved ? "Saved to Library" : "Save to Library"}
          </IonButton>
          
          <Citations book={book} text="Cite" />
          
          {url && (
            <IonButton fill="clear" size="small" href={url} target="_blank">
              <IonIcon slot="start" icon={documentOutline} />
              View Source
            </IonButton>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default Result;
