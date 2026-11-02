import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  return (
    <>
      <button
        type="button"
        className="btn btn-primary text-decoration-none d-flex gap-2"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
      >
        <i className="bi bi-box-arrow-left"></i>
        Logout
      </button>
    </>
  );
}
