import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import LibraryProvider from "./api/library";
import UserProvider from "./api/user";
import { initialize } from "./api/firebase";

initialize();

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
