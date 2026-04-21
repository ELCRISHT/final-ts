import { logout } from "../lib/api";

const useLogout = () => {
  const logoutMutation = async () => {
    try {
      // 1. Tell the server to clear the HttpOnly JWT cookie
      await logout();
    } catch {
      // Even if the server call fails, proceed with client-side cleanup
    } finally {
      // 2. Wipe all local storage (token, cached data, etc.)
      localStorage.clear();
      // 3. Hard-navigate to login — clears all React + React Query state
      window.location.href = "/login";
    }
  };

  return { logoutMutation, isPending: false, error: null };
};

export default useLogout;
