import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonLabel,
  IonAlert,
  IonSearchbar,
  IonChip,
} from "@ionic/react";
import React, { useState, useMemo } from "react";
import { libraryOutline, trashOutline, alertCircleOutline, arrowUp, arrowDown, pricetagOutline, chevronDown, chevronUp } from "ionicons/icons";
import { v4 } from "uuid";
import { useNavigate, Link } from "react-router-dom";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { toList } from "../api/scholar";
import BibTeXActions from "../components/BibTeXActions";

/**
 * The library is a collection of citations the user has bookmarked.
 * They can add keywords, quotes and track progress through their libraries contents.
 */
const LibraryPage = () => {
  const props = { name: "Library" };
  return (
    <Page {...props}>
      <Library />
    </Page>
  );
};

/**
 * The library relies on the library context.
 * This context updates upon snapshot changes on Firebase.
 * The library is reloaded to reflect those changes.
 */
const Library = () => {
  const [library, , , , clear] = useLibrary();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  
  // Search and Filter State
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"year" | "title">("year");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAllTags, setShowAllTags] = useState(false);

  // Calculate tag frequencies and unique tags
  const { topTags, otherTags } = useMemo(() => {
    const counts: Record<string, number> = {};
    library.forEach((book: any) => {
      (book.keywords || []).forEach((tag: string) => {
        const normalized = tag.toLowerCase();
        counts[normalized] = (counts[normalized] || 0) + 1;
      });
    });

    const sortedByFrequency = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);

    const top = sortedByFrequency.slice(0, 20).sort((a, b) => a.localeCompare(b));
    const other = sortedByFrequency.slice(20).sort((a, b) => a.localeCompare(b));

    return {
      topTags: top,
      otherTags: other
    };
  }, [library]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Filter and Sort Logic
  const filteredLibrary = library
    .filter((book: any) => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchText.toLowerCase()) ||
        book.authors.join(" ").toLowerCase().includes(searchText.toLowerCase());
      
      const matchesTags = 
        selectedTags.length === 0 || 
        selectedTags.every(tag => 
          (book.keywords || []).some((k: string) => k.toLowerCase() === tag.toLowerCase())
        );

      return matchesSearch && matchesTags;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      if (sortBy === "year") {
        comparison = a.year - b.year;
      } else {
        comparison = a.title.localeCompare(b.title);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <BibTeXActions />
          {library.length > 0 && (
            <IonButton fill="outline" size="small" color="secondary" onClick={() => navigate("/page/TaggingWizard")}>
              <IonIcon slot="start" icon={pricetagOutline} />
              Tagging Wizard
            </IonButton>
          )}
        </div>
        {library.length > 0 && (
          <IonButton 
            color="danger" 
            fill="outline" 
            size="small" 
            onClick={() => setShowAlert(true)}
            style={{ fontWeight: '600' }}
          >
            <IonIcon slot="start" icon={trashOutline} />
            Clear Library
          </IonButton>
        )}
      </div>

      <div style={{ background: 'var(--ion-color-step-50)', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--ion-border-color)' }}>
        <IonSearchbar 
          value={searchText} 
          onIonInput={(e) => setSearchText(e.detail.value!)}
          placeholder="Search by title or author..."
          style={{ padding: 0, marginBottom: '12px' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <IonLabel style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--ion-color-step-600)' }}>SORT BY:</IonLabel>
          <IonButton 
            fill={sortBy === "year" ? "solid" : "outline"} 
            size="small" 
            onClick={() => setSortBy("year")}
          >Year</IonButton>
          <IonButton 
            fill={sortBy === "title" ? "solid" : "outline"} 
            size="small" 
            onClick={() => setSortBy("title")}
          >Title</IonButton>
          <div style={{ width: '1px', height: '20px', background: 'var(--ion-border-color)', margin: '0 8px' }} />
          <IonButton 
            fill="clear" 
            size="small" 
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <IonIcon icon={sortOrder === "asc" ? arrowUp : arrowDown} slot="start" />
            {sortOrder === "asc" ? "Ascending" : "Descending"}
          </IonButton>
        </div>

        {(topTags.length > 0) && (
          <div style={{ marginTop: '16px' }}>
            <IonLabel style={{ display: 'block', fontWeight: '600', fontSize: '0.8rem', color: 'var(--ion-color-step-500)', marginBottom: '8px' }}>
              FILTER BY TAG:
            </IonLabel>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {topTags.map(tag => (
                <IonChip 
                  key={tag} 
                  color={selectedTags.includes(tag) ? "primary" : "medium"}
                  outline={!selectedTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                  style={{ margin: 0, fontSize: '0.8rem' }}
                >
                  <IonLabel>{tag}</IonLabel>
                </IonChip>
              ))}
              
              {otherTags.length > 0 && (
                <IonButton 
                  fill="clear" 
                  size="small" 
                  onClick={() => setShowAllTags(!showAllTags)}
                  style={{ fontSize: '0.75rem', '--padding-start': '4px' }}
                >
                  <IonIcon slot="end" icon={showAllTags ? chevronUp : chevronDown} />
                  {showAllTags ? "Hide rare tags" : `Show ${otherTags.length} more...`}
                </IonButton>
              )}
            </div>

            {showAllTags && otherTags.length > 0 && (
              <div style={{ 
                marginTop: '8px', 
                padding: '12px', 
                background: 'var(--ion-color-step-100)', 
                borderRadius: '12px',
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px' 
              }}>
                {otherTags.map(tag => (
                  <IonChip 
                    key={tag} 
                    color={selectedTags.includes(tag) ? "primary" : "medium"}
                    outline={!selectedTags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                    style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}
                  >
                    <IonLabel>{tag}</IonLabel>
                  </IonChip>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Clear Library?"
        message="This will permanently delete all saved papers and their associated notes. This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: 'Delete All',
            role: 'destructive',
            handler: () => {
              clear();
            },
          },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredLibrary.map((book: any) => (
          <BookCard key={book.uid || v4()} {...book} />
        ))}
      </div>
      
      {filteredLibrary.length === 0 && library.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <p style={{ color: 'var(--ion-color-step-500)' }}>No matches found for your current search/filters.</p>
          <IonButton fill="clear" onClick={() => { setSearchText(""); setSelectedTags([]); }}>Clear All Filters</IonButton>
        </div>
      )}

      {library.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <IonIcon icon={libraryOutline} style={{ fontSize: '64px', color: 'var(--ion-color-step-300)' }} />
          <h2 style={{ color: 'var(--ion-color-step-500)' }}>Your library is empty</h2>
          <p>Search for papers in Explore to add them here.</p>
        </div>
      )}
    </div>
  );
};

const BookCard = (book: any) => {
  const navigate = useNavigate();
  const [, , , remove] = useLibrary();
  const { title, authors, year } = book;
  
  return (
    <IonCard 
      onClick={() => navigate("/page/Book/" + encodeURIComponent(title))}
      style={{ margin: 0, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <IonCardHeader>
        <IonCardSubtitle style={{ color: 'var(--ion-color-secondary)' }}>{year}</IonCardSubtitle>
        <IonCardTitle style={{ fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.2' }}>{title}</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent style={{ flex: 1 }}>
        <IonLabel color="medium" style={{ fontSize: '0.85rem' }}>{toList(authors)}</IonLabel>
      </IonCardContent>

      <div style={{ padding: '8px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--ion-border-color, #eee)' }}>
        <IonButton 
          fill="clear" 
          color="danger" 
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            remove(title);
          }}
        >
          <IonIcon slot="icon-only" icon={trashOutline} />
        </IonButton>
      </div>
    </IonCard>
  );
};

export default LibraryPage;
