import { IonButton, IonList, IonSearchbar, IonItem, IonLabel, IonInput, IonIcon, IonBadge } from "@ionic/react";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";
import Page from "../components/Page";
import Result from "../components/Result";
import { scholar, SearchOptions } from "../api/scholar";
import { filterOutline, optionsOutline } from "ionicons/icons";

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
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [year, setYear] = useState("");
  const [minCitations, setMinCitations] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState("relevance");

  const search = () => {
    if (query === "") {
      setResults([]);
      return;
    }
    setIsSearching(true);
    
    const options: SearchOptions = {};
    if (year) options.year = year;
    if (minCitations) options.minCitations = minCitations;
    if (sort !== "relevance") options.sort = sort;

    scholar(query, options).then((search_results) => {
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
        flexDirection: 'column',
        gap: '10px',
        marginBottom: '20px',
        position: hasResults ? 'sticky' : 'relative',
        top: hasResults ? '0' : 'auto',
        zIndex: 10,
        background: hasResults ? 'var(--ion-background-color)' : 'transparent',
        padding: hasResults ? '10px 0' : '0'
      }}>
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
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
          <IonButton 
            fill="clear" 
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? "primary" : "medium"}
          >
            <IonIcon icon={optionsOutline} slot="icon-only" />
            {(year || minCitations || sort !== "relevance") && (
              <IonBadge color="primary" style={{ position: 'absolute', top: '0', right: '0', fontSize: '10px' }}>!</IonBadge>
            )}
          </IonButton>
          <IonButton onClick={search} disabled={isSearching}>
            {isSearching ? '...' : 'Search'}
          </IonButton>
        </div>

        {showFilters && (
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            padding: '15px', 
            background: 'var(--ion-color-step-50)', 
            borderRadius: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            border: '1px solid var(--ion-color-step-150)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonLabel style={{ fontSize: '0.9rem', fontWeight: '600' }}>Year:</IonLabel>
              <input 
                type="text" 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2020-2024"
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--ion-color-step-200)',
                  background: 'var(--ion-background-color)',
                  color: 'var(--ion-text-color)',
                  width: '120px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonLabel style={{ fontSize: '0.9rem', fontWeight: '600' }}>Min Citations:</IonLabel>
              <input 
                type="number" 
                value={minCitations || ''} 
                onChange={(e) => setMinCitations(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="0"
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--ion-color-step-200)',
                  background: 'var(--ion-background-color)',
                  color: 'var(--ion-text-color)',
                  width: '80px'
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonLabel style={{ fontSize: '0.9rem', fontWeight: '600' }}>Sort By:</IonLabel>
              <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value)}
                style={{ 
                  padding: '6px 10px', 
                  borderRadius: '6px', 
                  border: '1px solid var(--ion-color-step-200)',
                  background: 'var(--ion-background-color)',
                  color: 'var(--ion-text-color)'
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="citationCount:desc">Most Citations</option>
                <option value="year:desc">Newest</option>
              </select>
            </div>
            <IonButton 
              size="small" 
              fill="clear" 
              onClick={() => { setYear(""); setMinCitations(undefined); setSort("relevance"); }}
              style={{ marginLeft: 'auto' }}
            >
              Reset
            </IonButton>
          </div>
        )}
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
