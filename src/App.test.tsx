import React from "react";
import { render } from "@testing-library/react";
import UserProvider from "./api/user";
import LibraryProvider from "./api/library";
import App from "./App";

test("renders without crashing", () => {
  const { baseElement } = render(
    <UserProvider>
      <LibraryProvider>
        <App />
      </LibraryProvider>
    </UserProvider>
  );
  expect(baseElement).toBeDefined();
});
