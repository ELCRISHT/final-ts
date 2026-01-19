import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "../lib/api";

const useLogout = () => {
  const queryClient = useQueryClient();

  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      localStorage.removeItem('token'); // Clear token on logout
      queryClient.clear(); // Clear all cached data
      window.location.href = '/login'; // Redirect to login
    },
    onError: () => {
      // Even on error, clear token and redirect
      localStorage.removeItem('token');
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;
