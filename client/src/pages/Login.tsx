import { useState } from "react";
import { Link } from "react-router-dom";

// Field Validation Errors
interface LoginErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>): void {
    try {
      event.preventDefault();
      setErrorMsg("");

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
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container p-3">
      <div
        className="mx-auto w-100 p-4 border border-1 bg-secondary-subtle rounded-2"
        style={{ maxWidth: "500px" }}
      >
        <div className="d-flex flex-column gap-2 align-items-center">
          <div className="bg-secondary px-3 py-2 rounded-2">
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
          {/* General Error Message */}
          <div
            className={`alert alert-danger fade my-3 ${errorMsg ? "show" : "d-none"}`}
          >
            <p className="text-danger mb-0">{errorMsg}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
