import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonLabel,
  IonChip,
  IonInput,
  IonProgressBar,
  IonButtons,
  IonBackButton,
  IonToolbar,
  IonHeader,
  IonContent,
  IonText
} from "@ionic/react";
import React, { useState, useMemo } from "react";
import { checkmarkCircleOutline, chevronForwardOutline, chevronBackOutline, flashOutline, addOutline, closeCircleOutline } from "ionicons/icons";
import Page from "../components/Page";
import { useLibrary, Book } from "../api/library";
import { toList } from "../api/scholar";

/**
 * A specialized tool for rapid-fire tagging of the entire library.
 */
const TaggingWizard: React.FC = () => {
  const [library, , , , , update] = useLibrary();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customTag, setCustomTag] = useState("");

  // Filter library for papers that have no tags
  const untaggedPapers = useMemo(() => {
    return library.filter((b: any) => !b.keywords || b.keywords.length === 0);
  }, [library]);

  const currentBook = untaggedPapers[currentIndex];
  const progress = untaggedPapers.length > 0 ? (currentIndex + 1) / untaggedPapers.length : 0;

  // ... (dictionary remains the same)
  const dictionary = [
    "Machine Learning", "Deep Learning", "CNN", "RNN", "Transformer", "NLP", 
    "Computer Vision", "Mass Spectrometry", "REIMS", "iKnife", "Fish", 
    "Aquaculture", "Fraud", "Traceability", "Spectroscopy", "Metabolomics", 
    "Lipidomics", "DNA Barcoding", "Microplastics", "Heavy Metals", "Classification",
    "Regression", "Anomaly Detection", "Food Safety", "Sustainable", "Spectral"
  ];

  // Automated Suggestion Engine
  const suggestions = useMemo(() => {
    if (!currentBook) return [];
    const text = (currentBook.title + " " + (currentBook.description || "")).toLowerCase();
    const currentTags = (currentBook.keywords || []).map((t: string) => t.toLowerCase());
    
    return dictionary.filter(term => 
      text.includes(term.toLowerCase()) && 
      !currentTags.includes(term.toLowerCase())
    );
  }, [currentBook]);

  const addTag = (tag: string) => {
    if (!currentBook || !tag || !tag.trim()) return;
    const normalizedTag = tag.trim().toLowerCase();
    const existing = (currentBook.keywords || []).map((t: string) => t.toLowerCase());
    
    if (existing.includes(normalizedTag)) return;
    
    // Explicitly include existing data to prevent any potential loss
    update(currentBook.bid, { 
      ...currentBook,
      keywords: [...(currentBook.keywords || []), normalizedTag] 
    });
  };

  const removeTag = (tag: string) => {
    if (!currentBook) return;
    const normalizedTag = tag.toLowerCase();
    const existing = currentBook.keywords || [];
    update(currentBook.bid, { 
      ...currentBook,
      keywords: existing.filter((t: string) => t.toLowerCase() !== normalizedTag) 
    });
  };

  const handleNext = () => {
    if (currentIndex < untaggedPapers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (library.length === 0) {
    return (
      <Page name="Tagging Wizard">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <IonText color="medium">Your library is empty. Add papers to use the tagging wizard.</IonText>
        </div>
      </Page>
    );
  }

  if (untaggedPapers.length === 0) {
    return (
      <Page name="Tagging Wizard">
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '64px', marginBottom: '16px' }} />
          <h2>All Caught Up!</h2>
          <p style={{ color: 'var(--ion-color-step-600)' }}>Every paper in your library has at least one tag.</p>
          <IonButton fill="outline" shape="round" routerLink="/page/Library" style={{ marginTop: '24px' }}>
            Return to Library
          </IonButton>
        </div>
      </Page>
    );
  }

  return (
    <Page name="Tagging Wizard">
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        
        {/* Progress Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <IonLabel color="primary" style={{ fontWeight: 'bold' }}>
              Paper {currentIndex + 1} of {untaggedPapers.length}
            </IonLabel>
            <IonLabel color="medium">{Math.round(progress * 100)}% Complete</IonLabel>
          </div>
          <IonProgressBar value={progress} />
        </div>

        <IonCard style={{ margin: 0, border: '1px solid var(--ion-border-color)' }}>
          <IonCardHeader>
            <IonCardSubtitle>{currentBook.year}</IonCardSubtitle>
            <IonCardTitle style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentBook.title}</IonCardTitle>
            <IonLabel color="medium">{toList(currentBook.authors)}</IonLabel>
          </IonCardHeader>

          <IonCardContent>
            {/* Existing Tags */}
            <div style={{ marginBottom: '20px' }}>
              <IonLabel style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--ion-color-step-500)', marginBottom: '8px' }}>
                APPLIED TAGS
              </IonLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(currentBook.keywords || []).map((tag: string) => (
                  <IonChip key={tag} color="primary">
                    <IonLabel>{tag}</IonLabel>
                    <IonIcon icon={closeCircleOutline} onClick={() => removeTag(tag)} />
                  </IonChip>
                ))}
                {(!currentBook.keywords || currentBook.keywords.length === 0) && (
                  <IonText color="medium" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No tags yet</IonText>
                )}
              </div>
            </div>

            {/* Smart Suggestions */}
            <div style={{ marginBottom: '24px', background: 'var(--ion-color-step-50)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <IonIcon icon={flashOutline} color="warning" />
                <IonLabel style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Smart Suggestions</IonLabel>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestions.map(tag => (
                  <IonChip key={tag} outline color="primary" onClick={() => addTag(tag)} style={{ cursor: 'pointer' }}>
                    <IonIcon icon={addOutline} />
                    <IonLabel>{tag}</IonLabel>
                  </IonChip>
                ))}
                {suggestions.length === 0 && (
                  <IonText color="medium" style={{ fontSize: '0.8rem' }}>No more automated suggestions for this paper.</IonText>
                )}
              </div>
            </div>

            {/* Custom Entry */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <IonInput 
                placeholder="Add custom tag..." 
                value={customTag}
                onIonInput={e => setCustomTag(e.detail.value!)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(customTag);
                    setCustomTag("");
                  }
                }}
                style={{ background: 'var(--ion-color-step-100)', borderRadius: '8px', '--padding-start': '12px' }}
              />
              <IonButton onClick={() => { addTag(customTag); setCustomTag(""); }}>
                Add
              </IonButton>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--ion-border-color)', paddingTop: '20px' }}>
              <IonButton fill="clear" onClick={handlePrev} disabled={currentIndex === 0}>
                <IonIcon slot="start" icon={chevronBackOutline} />
                Previous
              </IonButton>
              <IonButton fill="solid" onClick={handleNext} disabled={currentIndex === untaggedPapers.length - 1}>
                Save & Next
                <IonIcon slot="end" icon={chevronForwardOutline} />
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <IonButton fill="outline" routerLink="/page/Library">
            <IonIcon slot="start" icon={checkmarkCircleOutline} />
            Finish & Return to Library
          </IonButton>
        </div>
      </div>
    </Page>
  );
};

export default TaggingWizard;
