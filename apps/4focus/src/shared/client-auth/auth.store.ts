import { map, onMount } from "nanostores";

// Define the shape of our authentication state
export type AuthState = {
  user: { id?: string; email?: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasBeenFetched: boolean; // Flag to prevent re-fetching
};

// Create the store with its initial state
export const authStore = map<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start in a loading state
  hasBeenFetched: false,
});

// The onMount lifecycle hook runs when the store is first used by a component.
// This is the ideal place to fetch the session to ensure it only happens once.
onMount(authStore, () => {
  // Use an IIFE to run async logic inside the synchronous onMount callback.
  (async () => {
    // If we have already fetched the session, don't do it again.
    if (authStore.get().hasBeenFetched) {
      return;
    }

    try {
      const response = await fetch("/api/session");

      if (!response.ok) {
        throw new Error("Failed to fetch session");
      }

      const user = (await response.json()) as { id?: string; email?: string };

      // Update the store with the session data
      authStore.set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        hasBeenFetched: true, // Mark as fetched
      });
    } catch (error) {
      // In case of any error (including 401), we treat the user as unauthenticated.
      console.error("Session fetch failed:", error);
      authStore.set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasBeenFetched: true, // Mark as fetched even on error
      });
    }
  })();
});
