export const capitialize = (str) => {
  if (!str) return ""; // Return empty string if input is undefined/null
  return str.charAt(0).toUpperCase() + str.slice(1);
};