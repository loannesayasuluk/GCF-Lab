"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthUserContextType {
  user: User | null;
  loading: boolean;
}

const AuthUserContext = createContext<AuthUserContextType>({ user: null, loading: true });

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthUserContext.Provider value={{ user, loading }}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser() {
  return useContext(AuthUserContext);
} 