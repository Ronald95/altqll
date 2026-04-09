//Can.jsx
import { useAuth } from "../../context/AuthContext";

export const Can = ({ permission, children }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) return null;
  
  return <>{children}</>;
};