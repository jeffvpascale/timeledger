import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import MessageBox, { type StatusMessage } from "../components/MessageBox";

// Field Validation Errors
interface LoginErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shouldRemember, setShouldRemember] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

  const { login } = useAuthContext();

  const navigate = useNavigate();

  const location = useLocation();

  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(
    () => location.state ?? null,
  );

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, {
        replace: true,
        state: null,
      });
    }
  }, [location.state, location.pathname, navigate]);

  async function handleSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    try {
      event.preventDefault();
      setStatusMessage(null);

      const formErrors: LoginErrors = {};
      const emailInput = event.currentTarget.elements.namedItem(
        "emailAddress",
      ) as HTMLInputElement;
      if (!emailInput.validity.valid) {
        formErrors.email = "Please enter a valid email address.";
      }
      if (!password.trim()) {
        formErrors.password = "Please enter a password.";
      }

      setLoginErrors(formErrors);
      if (Object.keys(formErrors).length > 0) {
        return;
      }
      setIsLoading(true);
      await login(email, password, shouldRemember);
      navigate("/time-ledger");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? {
              message: error.message,
              isSuccess: false,
            }
          : {
              message: "An unexpected error occurred.",
              isSuccess: false,
            },
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container p-3">
      <div
        className="mx-auto w-100 p-4 border border-1 rounded-2"
        style={{ maxWidth: "500px" }}
      >
        <div className="d-flex flex-column gap-2 align-items-center">
          <div className="bg-primary text-white px-3 py-2 rounded-2">
            <i className="bi bi-clock fs-2"></i>
          </div>
          <p className="fs-4 m-0">Welcome Back</p>
          <p>Sign in to your account</p>
          <div className="w-100 px-3">
            <form noValidate onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="emailAddress" className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  className={`form-control ${loginErrors.email ? "is-invalid" : ""}`}
                  id="emailAddress"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setLoginErrors({
                      ...loginErrors,
                      email: undefined,
                    });
                    setEmail(e.target.value);
                  }}
                />
                {loginErrors.email && (
                  <div className="invalid-feedback">{loginErrors.email}</div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  maxLength={128}
                  className={`form-control ${loginErrors.password ? "is-invalid" : ""}`}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setLoginErrors({
                      ...loginErrors,
                      password: undefined,
                    });
                    setPassword(e.target.value);
                  }}
                />
                {loginErrors.password && (
                  <div className="invalid-feedback">{loginErrors.password}</div>
                )}
              </div>
              <div className="form-check mb-3 float-end">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMeCheckbox"
                  checked={shouldRemember}
                  onChange={(e) => {
                    setShouldRemember(e.target.checked);
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor="rememberMeCheckbox"
                >
                  Remember Me
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 mb-3 rounded-1 py-3"
                disabled={isLoading}
              >
                {isLoading && (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                )}
                Sign in
              </button>
            </form>
          </div>
          <p>
            Don't have an account?{" "}
            <Link to="/register">
              <strong>Register</strong>
            </Link>
          </p>
          <MessageBox statusMessage={statusMessage} />
        </div>
      </div>
    </div>
  );
}
