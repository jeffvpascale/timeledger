import { useState, type ComponentPropsWithoutRef } from "react";

type PasswordInputProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  error?: string;
};

export default function PasswordInput({
  error,
  className = "",
  disabled,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="input-group has-validation">
      <input
        {...props}
        disabled={disabled}
        type={showPassword ? "text" : "password"}
        className={`form-control rounded-end-0 ${error ? "is-invalid" : ""} ${className}`}
        aria-invalid={error ? true : undefined}
      />
      <button
        type="button"
        className="btn btn-outline-primary"
        disabled={disabled}
        onClick={() => setShowPassword((visible) => !visible)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        aria-controls={props.id}
      >
        <i
          className={`bi bi-eye${showPassword ? "-slash" : ""}`}
          aria-hidden="true"
        />
      </button>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}
