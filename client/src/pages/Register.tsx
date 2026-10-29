import { useState } from "react";
import { Link } from "react-router-dom";

interface RegisterErrors {
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});

  function handleRegisterSubmit(
    event: React.SubmitEvent<HTMLFormElement>,
  ): void {
    try {
      event.preventDefault();
      setErrorMsg("");

      const formErrors: RegisterErrors = {};

      if (firstName.trim().length < 2) {
        formErrors.firstName = "Please enter a first name.";
      }
      if (lastName.trim().length < 2) {
        formErrors.lastName = "Please enter a last name.";
      }

      const emailInput = event.currentTarget.elements.namedItem(
        "emailAddress",
      ) as HTMLInputElement;
      if (!emailInput.validity.valid) {
        formErrors.email = "Please enter a valid email address.";
      }
      if (!confirmPassword) {
        formErrors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        formErrors.confirmPassword = "Passwords don't match";
      }
      const isValidPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(
          password,
        );
      if (password.length < 8 || !isValidPassword) {
        formErrors.password =
          "Password must be at least 8 characters long with at least 1 uppercase, 1 lowercase, 1 number and 1 special character.";
      }

      setRegisterErrors(formErrors);
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
            <i className="bi bi-person-add fs-2"></i>
          </div>
          <p className="fs-4 m-0">Create an account</p>
          <p>Enter your details to get started</p>
          <div className="w-100 px-3">
            <form noValidate onSubmit={handleRegisterSubmit}>
              <div className="d-flex gap-3">
                <div className="mb-3 flex-fill">
                  <label htmlFor="firstName" className="form-label">
                    First name
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    className={`form-control ${registerErrors.firstName ? "is-invalid" : ""}`}
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => {
                      setRegisterErrors({
                        ...registerErrors,
                        firstName: undefined,
                      });
                      setFirstName(e.target.value);
                    }}
                  />
                  {registerErrors.firstName && (
                    <div className="invalid-feedback">
                      {registerErrors.firstName}
                    </div>
                  )}
                </div>
                <div className="mb-3 flex-fill">
                  <label htmlFor="lastName" className="form-label">
                    Last name
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    className={`form-control ${registerErrors.lastName ? "is-invalid" : ""}`}
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => {
                      setRegisterErrors({
                        ...registerErrors,
                        lastName: undefined,
                      });
                      setLastName(e.target.value);
                    }}
                  />
                  {registerErrors.lastName && (
                    <div className="invalid-feedback">
                      {registerErrors.lastName}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="company" className="form-label">
                  Company
                </label>
                <input
                  type="text"
                  maxLength={100}
                  className={`form-control ${registerErrors.company ? "is-invalid" : ""}`}
                  id="company"
                  placeholder="Your Company"
                  value={company}
                  onChange={(e) => {
                    setRegisterErrors({
                      ...registerErrors,
                      company: undefined,
                    });
                    setCompany(e.target.value);
                  }}
                />
                {registerErrors.company && (
                  <div className="invalid-feedback">
                    {registerErrors.company}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="emailAddress" className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  maxLength={254}
                  required
                  className={`form-control ${registerErrors.email ? "is-invalid" : ""}`}
                  id="emailAddress"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setRegisterErrors({
                      ...registerErrors,
                      email: undefined,
                    });
                    setEmail(e.target.value);
                  }}
                />
                {registerErrors.email && (
                  <div className="invalid-feedback">{registerErrors.email}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-group has-validation">
                  <input
                    type={showPassword ? "text" : "password"}
                    maxLength={128}
                    className={`form-control ${registerErrors.password ? "is-invalid" : ""}`}
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setRegisterErrors({
                        ...registerErrors,
                        password: undefined,
                      });
                      setPassword(e.target.value);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide passwords" : "Show passwords"
                    }
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                    )}
                    <i
                      className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                    ></i>
                  </button>
                  {registerErrors.password && (
                    <div className="invalid-feedback">
                      {registerErrors.password}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm password
                </label>
                <div className="input-group has-validation">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    maxLength={128}
                    className={`form-control  ${registerErrors.confirmPassword ? "is-invalid" : ""}`}
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setRegisterErrors({
                        ...registerErrors,
                        confirmPassword: undefined,
                      });
                      setConfirmPassword(e.target.value);
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Hide passwords" : "Show passwords"
                    }
                  >
                    <i
                      className={`bi bi-eye${showPassword ? "-slash" : ""}`}
                    ></i>
                  </button>
                  {registerErrors.confirmPassword && (
                    <div className="invalid-feedback">
                      {registerErrors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3 rounded-1 py-3"
              >
                Create account
              </button>
            </form>
          </div>
          <p>
            Already have an account?{" "}
            <Link to="/login">
              <strong>Sign in</strong>
            </Link>
          </p>
        </div>
      </div>
      {/* General Error Message */}
      <div
        className={`alert alert-danger fade my-3 ${errorMsg ? "show" : "d-none"}`}
      >
        <p className="text-danger mb-0">{errorMsg}</p>
      </div>
    </div>
  );
}
