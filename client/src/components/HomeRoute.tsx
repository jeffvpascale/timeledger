import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import Login from "../pages/Login";

export default function HomeRoute() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) return <p>Loading...</p>;

  return user ? <Navigate to="/time-ledger" replace /> : <Login />;
}
