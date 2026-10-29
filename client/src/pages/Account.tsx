import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

interface AccountDetailsErrors {
  firstName?: string;
  lastName?: string;
  company?: string;
}

interface PasswordChangeErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export default function Account() {
  const { user } = useAuthContext();

  const [isLoadingAccountDetails, setIsLoadingAccountDetails] = useState(false);
  const [isLoadingChangePassword, setIsLoadingChangePassword] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const emailAddress = user?.email ?? "";

  const [errorMsg, setErrorMsg] = useState("");
  const [accountDetailErrors, setAccountDetailErrors] =
    useState<AccountDetailsErrors>({});
  const [passwordChangeErrors, setPasswordChangeErrors] =
    useState<PasswordChangeErrors>({});

  function handleAccountDetailsUpdate(
    event: React.SubmitEvent<HTMLFormElement>,
  ): void {
    try {
      event.preventDefault();
      setErrorMsg("");

      const formErrors: AccountDetailsErrors = {};

      if (firstName.trim().length < 2) {
        formErrors.firstName = "Please enter a first name.";
      }
      if (lastName.trim().length < 2) {
        formErrors.lastName = "Please enter a last name.";
      }

      setAccountDetailErrors(formErrors);
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
      setIsLoadingAccountDetails(false);
    }
  }

  function handleSubmitPasswordChange(
    event: React.SubmitEvent<HTMLFormElement>,
  ): void {
    try {
      event.preventDefault();
      setErrorMsg("");

      const formErrors: PasswordChangeErrors = {};
      if (!currentPassword) {
        formErrors.currentPassword = "Please enter your current password.";
      }
      if (!newPassword) {
        formErrors.newPassword = "Please enter a new password.";
      } else if (newPassword !== confirmNewPassword) {
        formErrors.confirmNewPassword = "Passwords don't match";
      }
      const isValidPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(
          newPassword,
        );
      if (newPassword.length < 8 || !isValidPassword) {
        formErrors.newPassword =
          "Password must be at least 8 characters long with at least 1 uppercase, 1 lowercase, 1 number and 1 special character.";
      }

      setPasswordChangeErrors(formErrors);
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
      setIsLoadingChangePassword(false);
    }
  }

  return (
    <>
      {/* General Error Message */}
      <div
        className={`alert alert-danger fade my-3 ${errorMsg ? "show" : "d-none"}`}
      >
        <p className="text-danger mb-0">{errorMsg}</p>
      </div>
      {renderChangeAccountDetails()}
      {renderChangePassword()}
    </>
  );
  function renderChangeAccountDetails() {
    return (
      <div className="container p-3">
        <div className="mx-auto w-100 p-4" style={{ maxWidth: "500px" }}>
          <Link
            to="/time-ledger"
            className="btn btn-primary text-decoration-none"
          >
            <strong>Back</strong>
          </Link>
        </div>
        <div
          className="mx-auto w-100 p-4 border border-1 bg-secondary-subtle rounded-2"
          style={{ maxWidth: "500px" }}
        >
          <div className="d-flex flex-column gap-2 align-items-center">
            <div className="bg-secondary px-3 py-2 rounded-2">
              <i className="bi bi-person fs-2"></i>
            </div>
            <p className="fs-4 m-0">Edit your account</p>
            <div className="w-100 px-3">
              <form noValidate onSubmit={handleAccountDetailsUpdate}>
                <div className="mb-3">
                  <label htmlFor="firstName" className="form-label">
                    First name
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    className={`form-control ${accountDetailErrors.firstName ? "is-invalid" : ""}`}
                    id="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => {
                      setAccountDetailErrors({
                        ...accountDetailErrors,
                        firstName: undefined,
                      });
                      setFirstName(e.target.value);
                    }}
                  />
                  {accountDetailErrors.firstName && (
                    <div className="invalid-feedback">
                      {accountDetailErrors.firstName}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="lastName" className="form-label">
                    Last name
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    className={`form-control ${accountDetailErrors.lastName ? "is-invalid" : ""}`}
                    id="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => {
                      setAccountDetailErrors({
                        ...accountDetailErrors,
                        firstName: undefined,
                      });
                      setLastName(e.target.value);
                    }}
                  />
                  {accountDetailErrors.lastName && (
                    <div className="invalid-feedback">
                      {accountDetailErrors.lastName}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="company" className="form-label">
                    Company
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    className={`form-control ${accountDetailErrors.company ? "is-invalid" : ""}`}
                    id="company"
                    placeholder="Your Company"
                    value={company}
                    onChange={(e) => {
                      setAccountDetailErrors({
                        ...accountDetailErrors,
                        firstName: undefined,
                      });
                      setCompany(e.target.value);
                    }}
                  />
                  {accountDetailErrors.company && (
                    <div className="invalid-feedback">
                      {accountDetailErrors.company}
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
                    className="form-control"
                    id="emailAddress"
                    value={emailAddress}
                    disabled
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3 rounded-1 py-3"
                  disabled={isLoadingAccountDetails}
                >
                  {isLoadingAccountDetails && (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                  )}
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
  function renderChangePassword() {
    return (
      <div className="container p-3">
        <div
          className="mx-auto w-100 p-4 border border-1 bg-secondary-subtle rounded-2"
          style={{ maxWidth: "500px" }}
        >
          <div className="d-flex flex-column gap-2 align-items-center">
            <p className="fs-4 m-0">Update your password</p>
            <div className="w-100 px-3">
              <form noValidate onSubmit={handleSubmitPasswordChange}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    maxLength={128}
                    className={`form-control ${passwordChangeErrors.currentPassword ? "is-invalid" : ""}`}
                    id="currentPassword"
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => {
                      setPasswordChangeErrors({
                        ...passwordChangeErrors,
                        currentPassword: undefined,
                      });
                      setCurrentPassword(e.target.value);
                    }}
                  />
                  {passwordChangeErrors.currentPassword && (
                    <div className="invalid-feedback">
                      {passwordChangeErrors.currentPassword}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    maxLength={128}
                    className={`form-control ${passwordChangeErrors.newPassword ? "is-invalid" : ""}`}
                    id="newPassword"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => {
                      setPasswordChangeErrors({
                        ...passwordChangeErrors,
                        newPassword: undefined,
                      });
                      setNewPassword(e.target.value);
                    }}
                  />
                  {passwordChangeErrors.newPassword && (
                    <div className="invalid-feedback">
                      {passwordChangeErrors.newPassword}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmNewPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    maxLength={128}
                    className={`form-control ${passwordChangeErrors.confirmNewPassword ? "is-invalid" : ""}`}
                    id="confirmNewPassword"
                    placeholder="Confirm your new password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setPasswordChangeErrors({
                        ...passwordChangeErrors,
                        confirmNewPassword: undefined,
                      });
                      setConfirmNewPassword(e.target.value);
                    }}
                  />
                  {passwordChangeErrors.confirmNewPassword && (
                    <div className="invalid-feedback">
                      {passwordChangeErrors.confirmNewPassword}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3 rounded-1 py-3"
                  disabled={isLoadingChangePassword}
                >
                  {isLoadingChangePassword && (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                  )}
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
