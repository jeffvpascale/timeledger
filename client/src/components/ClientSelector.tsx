import React, { useState, type SubmitEvent } from "react";
import type { Client } from "../types/Client";

// Component Props
interface ClientSelectorProps {
  clientList: Client[];
  selectedClientId: number | null;
  showArchived: boolean;
  onShowArchivedChange: (checked: boolean) => void;
  onClientChange: (id: number) => Promise<void>;
  onClientAdd: (name: string) => Promise<void>;
  onClientEdit: (
    id: number,
    name: string,
    isArchived: boolean,
  ) => Promise<void>;
  onModeChange: (status: Status) => void;
}

// Selector Modes
export type Status = "selecting" | "updating" | "adding";

export default function ClientSelector({
  clientList,
  selectedClientId,
  showArchived,
  onShowArchivedChange,
  onClientChange,
  onClientAdd,
  onClientEdit,
  onModeChange,
}: ClientSelectorProps) {
  // Helpers
  const hasClients = () => clientList.length > 0;

  // Component State
  const [clientName, setClientName] = useState("");
  const [isArchived, setIsArchived] = useState(false);
  const visibleClients = clientList.filter(
    (client) => showArchived || !client.isArchived,
  );

  const [status, setStatus] = useState<Status>(() =>
    hasClients() ? "selecting" : "adding",
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [clientNameError, setClientNameError] = useState("");

  // Update Mode and Notify Parent
  function changeStatus(newStatus: Status) {
    setStatus(newStatus);
    onModeChange(newStatus);
  }

  function ResetClient() {
    setClientName("");
    setIsArchived(false);
  }
  // Main Component Layout
  return (
    <div className="mb-3 border-1 border p-5 rounded-4">
      <label className="form-label fw-bold mb-4">Client</label>

      {/* Selector or Add/Edit Form */}
      {status !== "selecting" || clientList.length === 0
        ? renderForm()
        : renderSelect()}

      {/* General Error Message */}
      <div
        className={`alert alert-danger fade my-3 ${errorMsg ? "show" : "d-none"}`}
      >
        <p className="text-danger mb-0">{errorMsg}</p>
      </div>
    </div>
  );

  // Add/Edit Client Form
  function renderForm() {
    // Save Client
    async function handleSaveClient(event: SubmitEvent): Promise<void> {
      try {
        event.preventDefault();
        setErrorMsg("");

        const clientNameTrimmed = clientName.trim();
        if (!clientNameTrimmed) {
          setClientNameError("Please enter a client name.");
          return;
        }

        const duplicateExists = clientList.some(
          (client) =>
            client.name === clientNameTrimmed &&
            (status === "adding" || client.id !== selectedClientId),
        );
        if (duplicateExists) {
          setClientNameError("Please enter a unique client name.");
          return;
        }

        if (status === "adding") {
          setIsLoading(true);
          await onClientAdd(clientNameTrimmed);
          changeStatus("selecting");
        } else if (status === "updating") {
          if (selectedClientId === null) {
            throw new Error("Selected value cannot be empty.");
          }
          setIsLoading(true);
          await onClientEdit(
            Number(selectedClientId),
            clientNameTrimmed,
            isArchived,
          );
          changeStatus("selecting");
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
      <form onSubmit={handleSaveClient}>
        {/* Form Header */}
        <label className="form-label fw-bold mb-4">
          {status === "updating" ? "Edit Client" : "Add Client"}
        </label>

        {/* Client Name */}
        <div className="form-group mb-3">
          <label htmlFor="clientNameInput">Client Name</label>
          <input
            type="text"
            maxLength={100}
            className={`form-control ${clientNameError ? "is-invalid" : ""}`}
            id="clientNameInput"
            placeholder="Enter client name"
            value={clientName}
            onChange={(e) => {
              setClientNameError("");
              setClientName(e.target.value);
            }}
          />
          {clientNameError && (
            <div className="invalid-feedback">{clientNameError}</div>
          )}
        </div>

        {status === "updating" && (
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="archiveClientCheckbox"
              checked={isArchived}
              onChange={(e) => {
                setIsArchived(e.target.checked);
              }}
            />
            <label className="form-check-label" htmlFor="archiveClientCheckbox">
              Archive Client
            </label>
          </div>
        )}
        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2">
          {hasClients() && (
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={isLoading}
              onClick={() => {
                setErrorMsg("");
                setClientNameError("");
                changeStatus("selecting");
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading && (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
            )}
            {status === "adding" ? "Add Client" : "Update Client"}
          </button>
        </div>
      </form>
    );
  }

  // Client Selection Dropdown
  function renderSelect() {
    // Handle Client Selection
    async function handleClientChange(
      e: React.ChangeEvent<HTMLSelectElement>,
    ): Promise<void> {
      try {
        ResetClient();
        setErrorMsg("");
        setIsLoading(true);
        await onClientChange(Number(e.target.value));
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
      <div>
        <div className="d-flex align-items-center gap-2 mb-3">
          {/* Client Dropdown */}
          <select
            className="form-select rounded-4"
            disabled={isLoading}
            value={selectedClientId == null ? "" : Number(selectedClientId)}
            onChange={handleClientChange}
          >
            <option value="" disabled hidden>
              Select a client
            </option>
            {visibleClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
                {client.isArchived ? " (Archived)" : ""}
              </option>
            ))}
          </select>

          {/* Loading Indicator */}
          {isLoading && (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
          )}

          {/* Edit Client */}
          {selectedClientId !== null && (
            <button
              type="button"
              className="btn btn-outline-primary rounded-circle"
              title="Edit Client"
              aria-label="Edit Client"
              disabled={isLoading}
              onClick={() => {
                const client = clientList.find(
                  (client) => client.id === selectedClientId,
                );
                if (!client) return;
                setClientName(client.name);
                setIsArchived(client.isArchived);
                changeStatus("updating");
              }}
            >
              <i className="bi bi-pencil"></i>
            </button>
          )}

          {/* Add Client */}
          <button
            type="button"
            className="btn btn-primary rounded-circle"
            title="Add Client"
            aria-label="Add Client"
            disabled={isLoading}
            onClick={() => {
              ResetClient();
              changeStatus("adding");
            }}
          >
            <i className="bi bi-plus-lg"></i>
          </button>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            id="showArchivedClientCheckbox"
            checked={showArchived}
            disabled={isLoading}
            onChange={(e) => {
              onShowArchivedChange(e.target.checked);
            }}
          />
          <label
            className="form-check-label"
            htmlFor="showArchivedClientCheckbox"
          >
            Show Archived Clients
          </label>
        </div>
      </div>
    );
  }
}
