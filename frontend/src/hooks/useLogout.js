import { useQueryClient } from "@tanstack/react-query";

const useLogout = () => {
  const queryClient = useQueryClient();

  const logoutMutation = () => {
    // Clear token
    localStorage.removeItem('token');
    // Clear all cached data
    queryClient.clear();
    // Force full page reload to login
    window.location.replace('/login');
  };

  return { logoutMutation, isPending: false, error: null };
};
export default useLogout;
