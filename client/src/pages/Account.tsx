import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { editPassword } from "../services/authService";
import Logout from "../components/LogoutButton";
import MessageBox, { type StatusMessage } from "../components/MessageBox";

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
  const { user, updateUser } = useAuthContext();

  const [isLoadingAccountDetails, setIsLoadingAccountDetails] = useState(false);
  const [isLoadingChangePassword, setIsLoadingChangePassword] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const emailAddress = user?.email ?? "";

  const [accountDetailsStatusMessage, setAccountDetailsStatusMessage] =
    useState<StatusMessage | null>(null);
  const [passwordStatusMessage, setPasswordStatusMessage] =
    useState<StatusMessage | null>(null);
  const [accountDetailErrors, setAccountDetailErrors] =
    useState<AccountDetailsErrors>({});
  const [passwordChangeErrors, setPasswordChangeErrors] =
    useState<PasswordChangeErrors>({});

  async function handleAccountDetailsUpdate(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    try {
      event.preventDefault();
      setAccountDetailsStatusMessage(null);

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

      setIsLoadingAccountDetails(true);
      await updateUser(firstName, lastName, company, emailAddress);
      setAccountDetailsStatusMessage({
        message: "Account updated.",
        isSuccess: true,
      });
    } catch (error) {
      setAccountDetailsStatusMessage(
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
      setIsLoadingAccountDetails(false);
    }
  }

  async function handleSubmitPasswordChange(
    event: React.SubmitEvent<HTMLFormElement>,
  ): Promise<void> {
    try {
      event.preventDefault();
      setPasswordStatusMessage(null);

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
      setIsLoadingChangePassword(true);
      await editPassword(currentPassword, newPassword);
      setPasswordStatusMessage({
        message: "Password updated.",
        isSuccess: true,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      setPasswordStatusMessage(
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
      setIsLoadingChangePassword(false);
    }
  }

  return (
    <>
      <div className="container p-3" style={{ maxWidth: "500px" }}>
        <div className="d-flex justify-content-between py-4">
          <Link
            to="/time-ledger"
            className="btn btn-primary text-decoration-none"
          >
            <i className="bi bi-chevron-left me-2"></i>
            Back
          </Link>
          <Logout />
        </div>
        {renderChangeAccountDetails()}
        {renderChangePassword()}
      </div>
    </>
  );
  function renderChangeAccountDetails() {
    return (
      <div className="mx-auto w-100 p-4 border border-1 rounded-2 mb-4">
        <div className="d-flex flex-column gap-2 align-items-center">
          <div className="bg-primary px-3 py-2 text-white rounded-2">
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
                      lastName: undefined,
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
                      company: undefined,
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
              <MessageBox statusMessage={accountDetailsStatusMessage} />
            </form>
          </div>
        </div>
      </div>
    );
  }
  function renderChangePassword() {
    return (
      <div className="mx-auto w-100 p-4 border border-1 rounded-2">
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
              <MessageBox statusMessage={passwordStatusMessage} />
            </form>
          </div>
        </div>
      </div>
    );
  }
}
