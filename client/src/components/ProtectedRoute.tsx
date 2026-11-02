import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
