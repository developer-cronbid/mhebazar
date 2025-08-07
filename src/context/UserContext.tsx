// src/context/UserContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback
} from "react";
import Cookies from "js-cookie"; // Still needed for refresh_token if not HttpOnly, and for general purpose cookies.
import api from "@/lib/api";

interface UserBannerItem {
  id: number;
  url: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  phone: string | null;
  address: string | null;
  user_banner: UserBannerItem[];
  is_email_verified: boolean;
  is_account_locked: boolean;
  date_joined: string;
  last_login: string | null;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => { // Removed accessToken parameter
    try {
      console.log("[UserContext] Attempting to fetch user profile...");
      // For HttpOnly access tokens, the browser automatically sends the cookie.
      // So, we don't need to manually read it from `js-cookie` and pass it in the header here.
      // Axios `withCredentials: true` ensures the cookie is sent.
      const userResponse = await api.get('/users/me/');

      setUser(userResponse.data as User);
      console.log("[UserContext] User data fetched successfully.");
    } catch (error) {
      console.error("[UserContext] Failed to fetch user profile:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Dependencies for useCallback

  useEffect(() => {
    // We can still try to read a non-HttpOnly access token if it exists
    // OR more importantly, trigger fetchUser if we think a user might be logged in.
    // With HttpOnly tokens, we primarily rely on the backend setting them,
    // and the browser sending them automatically.
    // The presence of a refresh token (if not HttpOnly) can also indicate a session.

    // If you are relying purely on HttpOnly access tokens:
    // The initial load simply calls fetchUser without checking cookies via js-cookie
    // as js-cookie cannot read HttpOnly cookies.
    fetchUser();

    // If your refresh token is NOT HttpOnly and stored by js-cookie:
    // You might want to check for its existence before calling fetchUser.
    // const refreshToken = Cookies.get("refresh_token");
    // if (refreshToken) {
    //   fetchUser();
    // } else {
    //   setIsLoading(false);
    // }

  }, [fetchUser]);

  const logout = () => {
    setUser(null);
    Cookies.remove("access_token"); // Tries to remove it from frontend accessible cookies
    Cookies.remove("refresh_token"); // Removes refresh token from frontend accessible cookies
    // For HttpOnly cookies, you might need a backend endpoint to clear them on logout.
    // For now, this is client-side logout.
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};