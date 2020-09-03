import { IonSearchbar, IonButton, IonList } from "@ionic/react";
import React, { useState, useEffect } from "react";
import { v4 } from "uuid";
import Page from "../components/Page";
import Result from "../components/Result";
import { scholar } from "../api/scholar";

const ExplorePage: React.FC = () => {
  const props = { name: "Explore" };
  return (
    <Page {...props}>
      <Explore />
    </Page>
  );
};

const Explore: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  const search = () => {
    if (query === "") {
      setResults([]);
      return;
    }
    scholar(query).then(results => {
      setResults(results);
    });
  };

  useEffect(() => {}, [results]);

  return (
    <>
      <IonSearchbar
        value={query}
        onIonChange={(e: any) => setQuery(e.detail.value!)}
      ></IonSearchbar>
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
