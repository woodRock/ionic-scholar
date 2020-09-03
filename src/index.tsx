import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import LibraryProvider from "./api/library";
import UserProvider from "./api/user";
import {initialize} from "./api/firebase";

// Setup the firebase connection once.
initialize();

/**
 * The application requires two contexts to be provided at the DOM root.
 * The library and user contexts. These contexts are required by the subcomponents.
 */
ReactDOM.render(
  <UserProvider>
    <LibraryProvider>
      <App />
    </LibraryProvider>
  </UserProvider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
