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
  IonBadge,
} from "@ionic/react";
import React, { useState, useMemo } from "react";
import { libraryOutline, trashOutline, alertCircleOutline, arrowUp, arrowDown, pricetagOutline, chevronDown, chevronUp, star, bookOutline, closeOutline } from "ionicons/icons";
import { v4 } from "uuid";
import { useNavigate, Link } from "react-router-dom";
import Page from "../components/Page";
import { useLibrary } from "../api/library";
import { toList } from "../api/scholar";
import BibTeXActions from "../components/BibTeXActions";
import PDFReader from "../components/PDFReader";

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
  const [library, , , , clear, , pinnedTags, togglePinned] = useLibrary();
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  
  // Search and Filter State
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"year" | "title">("year");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAllTags, setShowAllTags] = useState(false);
  const [showReadingListOnly, setShowReadingListOnly] = useState(false);

  // Group tags into Pinned vs Others, both sorted alphabetically
  const { pinned, others } = useMemo(() => {
    const allUniqueTags: string[] = Array.from(new Set(
      library.flatMap((book: any) => (book.keywords || []).map((k: string) => k.toLowerCase()))
    ));

    const pinnedGroup = allUniqueTags
      .filter(tag => pinnedTags.includes(tag))
      .sort((a: string, b: string) => a.localeCompare(b));

    const othersGroup = allUniqueTags
      .filter(tag => !pinnedTags.includes(tag))
      .sort((a: string, b: string) => a.localeCompare(b));

    return { pinned: pinnedGroup, others: othersGroup };
  }, [library, pinnedTags]);

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

      const matchesReadingList = !showReadingListOnly || book.inReadingList;

      return matchesSearch && matchesTags && matchesReadingList;
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

  const renderTagChip = (tag: string, isPinned: boolean) => (
    <IonChip 
      key={tag} 
      color={selectedTags.includes(tag) ? "primary" : (isPinned ? "secondary" : "medium")}
      outline={!selectedTags.includes(tag)}
      onClick={() => toggleTag(tag)}
      onDoubleClick={() => togglePinned(tag)}
      style={{ margin: 0, fontSize: '0.8rem' }}
      title="Double-click to pin/unpin"
    >
      {isPinned && <IonIcon icon={star} style={{ fontSize: '0.7rem', marginRight: '4px' }} />}
      <IonLabel>{tag}</IonLabel>
    </IonChip>
  );

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ... existing header code ... */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <BibTeXActions />
          {library.length > 0 && (
            <IonButton fill="outline" size="small" color="secondary" onClick={() => navigate("/page/TaggingWizard")}>
              <IonIcon slot="start" icon={pricetagOutline} />
              Tagging Wizard
            </IonButton>
          )}
          <IonButton 
            fill={showReadingListOnly ? "solid" : "outline"} 
            size="small" 
            color="primary" 
            onClick={() => setShowReadingListOnly(!showReadingListOnly)}
          >
            <IonIcon slot="start" icon={bookOutline} />
            Reading List {library.filter((b: any) => b.inReadingList).length > 0 && `(${library.filter((b: any) => b.inReadingList).length})`}
          </IonButton>
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

        {(pinned.length > 0 || others.length > 0) && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {pinned.length > 0 && (
                <IonLabel style={{ width: '100%', fontWeight: '600', fontSize: '0.7rem', color: 'var(--ion-color-step-500)', marginBottom: '4px', letterSpacing: '0.05em' }}>
                  FAVOURITE TAGS:
                </IonLabel>
              )}
              {pinned.map(tag => renderTagChip(tag, true))}
              
              {showAllTags && (
                <>
                  <IonLabel style={{ width: '100%', fontWeight: '600', fontSize: '0.7rem', color: 'var(--ion-color-step-500)', marginTop: '12px', marginBottom: '4px', letterSpacing: '0.05em' }}>
                    ALL TAGS:
                  </IonLabel>
                  {others.map(tag => renderTagChip(tag, false))}
                </>
              )}
              
              {others.length > 0 && (
                <div style={{ width: '100%', marginTop: '4px' }}>
                  <IonButton 
                    fill="clear" 
                    size="small" 
                    onClick={() => setShowAllTags(!showAllTags)}
                    style={{ fontSize: '0.75rem', '--padding-start': '0' }}
                  >
                    <IonIcon slot="end" icon={showAllTags ? chevronUp : chevronDown} />
                    {showAllTags ? "Hide tags" : (pinned.length > 0 ? `Show ${others.length} more...` : "Show all tags")}
                  </IonButton>
                </div>
              )}
            </div>
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
  const [, , , remove, , update] = useLibrary();
  const [readerOpen, setReaderOpen] = useState(false);
  const { title, authors, year, url, inReadingList } = book;
  
  return (
    <>
      <IonCard 
        onClick={() => navigate("/page/Book/" + encodeURIComponent(title))}
        style={{ margin: 0, cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <IonCardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <IonCardSubtitle style={{ color: 'var(--ion-color-secondary)' }}>{year}</IonCardSubtitle>
            {inReadingList && <IonBadge color="primary" style={{ fontSize: '0.6rem' }}>LIST</IonBadge>}
          </div>
          <IonCardTitle style={{ fontSize: '1.1rem', fontWeight: '700', lineHeight: '1.2' }}>{title}</IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent style={{ flex: 1 }}>
          <IonLabel color="medium" style={{ fontSize: '0.85rem' }}>{toList(authors)}</IonLabel>
          <div style={{ marginTop: '8px' }}>
            <IonBadge color="light" style={{ fontSize: '0.7rem' }}>{book.numCitations || 0} CITATIONS</IonBadge>
          </div>
        </IonCardContent>

        <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--ion-border-color, #eee)', alignItems: 'center' }}>
          <div>
            {url && (
              <IonButton 
                fill="clear" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setReaderOpen(true);
                }}
              >
                <IonIcon slot="start" icon={bookOutline} />
                Read
              </IonButton>
            )}
          </div>
          <div style={{ display: 'flex' }}>
            {inReadingList && (
              <IonButton 
                fill="clear" 
                color="medium" 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  update(book.bid, { inReadingList: false });
                }}
                title="Remove from Reading List"
              >
                <IonIcon slot="icon-only" icon={closeOutline} />
              </IonButton>
            )}
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
        </div>
      </IonCard>

      {url && (
        <PDFReader 
          isOpen={readerOpen} 
          onClose={() => setReaderOpen(false)} 
          url={url} 
          book={book} 
          bid={book.bid} 
        />
      )}
    </>
  );
};

export default LibraryPage;
