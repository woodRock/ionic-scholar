import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, generateUserDocument } from "./firebase";

/**
 * This class retrieves the user information.
 * It can be used to judge if the user is authenticated.
 * It updates upon changes to the users authentication state.
 */

const UserContext = createContext<{ user: any; isLoading: boolean }>({ user: null, isLoading: true });

const useUser = () => useContext(UserContext);

const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (userAuth: any) => {
      setIsLoading(true);
      if (userAuth) {
        const userDoc = await generateUserDocument(userAuth);
        setUser(userDoc || userAuth); // Fallback to auth object if doc fails
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Here we provide utility methods for Sign Up validation.
 * These are on top of the existing Firebase errors.
 * These provide context sensitive errors before Firebase is called.
 */

let error = "";

const validEmail = (email: string): boolean => {
  const condition = email !== "";
  error = !condition ? "Invalid Email" : error;
  return condition;
};

const validUsername = (username: string): boolean => {
  const condition = username !== "";
  error = !condition ? "Invalid Username" : error;
  return condition;
};

const validPassword = (p1: string) => {
  const condition = p1 !== "";
  error = !condition ? "Invalid password" : error;
  return condition;
};

const passwordsMatch = (p1: string, p2: string): boolean => {
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
