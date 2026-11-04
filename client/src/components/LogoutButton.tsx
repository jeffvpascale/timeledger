import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();
  return (
    <>
      <button
        type="button"
        className="btn btn-primary text-decoration-none"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
      >
        <i className="bi bi-box-arrow-left me-2"></i>
        Logout
      </button>
    </>
  );
}
