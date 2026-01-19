const useLogout = () => {
  const logoutMutation = () => {
    // Clear token
    localStorage.removeItem('token');
    // Clear all localStorage to be safe
    localStorage.clear();
    // Force hard reload to clear all React state
    window.location.href = '/login';
    window.location.reload(true);
  };

  return { logoutMutation, isPending: false, error: null };
};
export default useLogout;
