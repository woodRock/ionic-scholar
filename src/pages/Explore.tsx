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

  const search = () => {
    if (query === "") {
      setResults([]);
      return;
    }
    scholar(query).then((results) => {
      setResults(results);
    });
  };

  useEffect(() => {}, [results]);

  return (
    <>
      <IonSearchbar
        value={query}
        onIonChange={(e: any) => setQuery(e.detail.value!)}
      />
      <IonButton expand="full" onClick={search}>
        Search
      </IonButton>
      <IonList>
        {results.map((book: any) => (
          <Result key={v4()} {...book} />
        ))}
      </IonList>
    </>
  );
};

export default ExplorePage;
