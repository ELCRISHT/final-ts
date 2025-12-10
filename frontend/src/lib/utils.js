export const capitialize = (str) => {
  // GUARD CLAUSE: If data is missing (undefined) or not a string, stop safely.
  if (!str) return ""; 
  
  return str.charAt(0).toUpperCase() + str.slice(1);
};