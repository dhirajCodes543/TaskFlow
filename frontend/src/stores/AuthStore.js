import { create } from "zustand";
import { onIdTokenChanged } from "firebase/auth";
import { auth } from "../firebase.js";

export const useAuthStore = create((set) => {
  const unsub = onIdTokenChanged(auth, (user) => {
    console.log("hua");
    set({
      isLoggedIn: !!user,
      isVerified: user?.emailVerified ?? false,
      isLoading: false,
    });
  });

  
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", unsub);
  }

  return {
    isLoggedIn: false,
    isVerified: false,
    isLoading: true,
  };
});
