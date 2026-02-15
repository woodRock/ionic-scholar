import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import LibraryProvider from "./api/library";
import UserProvider from "./api/user";
import "./api/firebase";

/**
 * The application requires two contexts to be provided at the DOM root.
 * The library and user contexts. These contexts are required by the subcomponents.
 */
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <UserProvider>
    <LibraryProvider>
      <App />
    </LibraryProvider>
  </UserProvider>
);

