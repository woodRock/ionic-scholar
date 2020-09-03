import React, { createContext, useState, useEffect, useContext } from "react";
import { auth, generateUserDocument } from "./firebase";

const UserContext = createContext<any>(null);

const useUser = () => useContext(UserContext);

const UserProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async userAuth => {
      const user = await generateUserDocument(userAuth);
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(userRef => {
      setUser(userRef);
    });
    return unsubscribe;
  });

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

let error = "";

const validEmail = (email: string): Boolean => {
  const condition = email !== "";
  error = !condition ? "Invalid Email" : error;
  return condition;
};

const validUsername = (username: string): Boolean => {
  const condition = username !== "";
  error = !condition ? "Invalid Username" : error;
  return condition;
};

const validPassword = (p1: string) => {
  const condition = p1 !== "";
  error = !condition ? "Invalid password" : error;
  return condition;
};

const passwordsMatch = (p1: string, p2: string): Boolean => {
  const condition = p1 === p2;
  error = !condition ? "Passwords do not match" : error;
  return condition;
};

const validation = (
  username: string,
  p1: string,
  p2: string,
  email: string
) => {
  const valid =
    validEmail(email) &&
    validUsername(username) &&
    validPassword(p1) &&
    passwordsMatch(p1, p2);
  return { valid: valid, error: error };
};

export default UserProvider;
export { useUser, validation };
