import { IonButton, IonList, IonSearchbar } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import Page from "../components/Page";
import Result from "../components/Result";
import { scholar } from "../api/scholar";

/**
 * The user can search for pages using the Scholarly API.
 * This performs a web-scrape on the Google Scholar search engine.
 * @constructor React Functional Component
 */
const ExplorePage: React.FC = () => {
  const props = { name: "Explore" };
  return (
    <Page {...props}>
      <Explore />
    </Page>
  );
};

/**
 * This component handles the search bar for the Explore page.
 * The Scholarly API cannot handle an empty search string.
 * The component relaods any time the results have changed.
 */
const Explore: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const search = () => {
    if (query === "") {
      setResults([]);
      return;
    }
    setIsSearching(true);
    scholar(query).then((search_results) => {
      setResults(search_results);
      setIsSearching(false);
    });
  };

  const hasResults = results.length > 0;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      minHeight: '100%',
      justifyContent: hasResults ? 'flex-start' : 'center',
      transition: 'justify-content 0.5s ease'
    }}>
      {!hasResults && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--ion-color-primary)' }}>Scholar</h1>
          <p style={{ color: 'var(--ion-color-step-600)' }}>Modern Academic Reference Management</p>
        </div>
      )}

      <div style={{ 
        width: '100%', 
        maxWidth: '800px', 
        display: 'flex', 
        gap: '10px',
        marginBottom: '20px',
        position: hasResults ? 'sticky' : 'relative',
        top: hasResults ? '0' : 'auto',
        zIndex: 10,
        background: hasResults ? 'var(--ion-background-color)' : 'transparent',
        padding: hasResults ? '10px 0' : '0'
      }}>
        <IonSearchbar
          value={query}
          onIonInput={(e: any) => setQuery(e.detail.value!)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              search();
            }
          }}
          enterKeyHint="search"
          placeholder="Search for papers, authors, or keywords..."
          style={{ flex: 1, padding: 0 }}
        />
        <IonButton onClick={search} disabled={isSearching}>
          {isSearching ? '...' : 'Search'}
        </IonButton>
      </div>

      <div style={{ width: '100%', maxWidth: '1000px' }}>
        {results.map((book: any) => (
          <Result key={v4()} {...book} />
        ))}
        {results.length === 0 && !hasResults && !isSearching && (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--ion-color-step-400)' }}>
            Try searching for &quot;Machine Learning&quot; or &quot;Quantum Physics&quot;
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
