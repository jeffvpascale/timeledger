import React, { useState, type SubmitEvent } from "react";
import type { Client } from "../types/Client";
import type { Project } from "../types/Project";
import { defaultHourlyRate } from "../services/serviceConfig";

// Component Props
interface ProjectSelectorProps {
  projectList: Project[];
  selectedProjectId: number | null;
  selectedClient: Client | null;
  showArchived: boolean;
  onShowArchivedChange: (checked: boolean) => void;
  onProjectChange: (id: number) => Promise<void>;
  onProjectAdd: (
    name: string,
    description: string,
    rate: number,
  ) => Promise<void>;
  onProjectEdit: (
    id: number,
    name: string,
    description: string,
    rate: number,
    isArchived: boolean,
  ) => Promise<void>;
  onModeChange: (status: Status) => void;
}

// Field Validation Errors
interface ProjectErrors {
  name?: string;
  rate?: string;
}

// Selector Modes
type Status = "selecting" | "updating" | "adding";

export default function ProjectSelector({
  projectList,
  selectedProjectId,
  selectedClient,
  showArchived,
  onShowArchivedChange,
  onProjectChange,
  onProjectAdd,
  onProjectEdit,
  onModeChange,
}: ProjectSelectorProps) {
  // Helpers
  const hasProjects = () => projectList.length > 0;

  // Project Form State
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectRate, setProjectRate] = useState(String(defaultHourlyRate));
  const [isArchived, setIsArchived] = useState(false);
  const visibleProjects = projectList.filter(
    (project) => showArchived || !project.isArchived,
  );

  // Selector State
  const [status, setStatus] = useState<Status>(() =>
    hasProjects() ? "selecting" : "adding",
  );

  // Loading and Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<ProjectErrors>({});

  // Update Mode and Notify Parent
  function changeStatus(newStatus: Status) {
    setStatus(newStatus);
    onModeChange(newStatus);
  }

  // Reset Project Form Fields
  function ResetProject() {
    setProjectName("");
    setProjectDescription("");
    setProjectRate(String(defaultHourlyRate));
    setIsArchived(false);
  }

  // Main Component Layout
  return (
    <div className="mb-3 border-1 border p-5 rounded-4">
      {/* Header */}
      <label className="form-label fw-bold mb-1 d-block">Project</label>
      <label className="form-label mb-4">{selectedClient?.name ?? ""}</label>

      {/* Selector or Add/Edit Form */}
      {status !== "selecting" || projectList.length === 0
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

  // Add/Edit Project Form
  function renderForm() {
    // Save Project
    async function handleSaveProject(event: SubmitEvent): Promise<void> {
      try {
        event.preventDefault();
        setErrorMsg("");

        // Validate Fields
        const projectErrors: ProjectErrors = {};
        const rate = Number(projectRate);

        if (!projectName.trim()) {
          projectErrors.name = "Please enter a project name.";
        }

        if (!projectRate.trim()) {
          projectErrors.rate = "Please enter a project rate.";
        } else if (!Number.isFinite(rate) || rate < 0) {
          projectErrors.rate = "Project rate must be 0 or greater.";
        }

        setErrors(projectErrors);

        if (Object.keys(projectErrors).length > 0) {
          return;
        }

        // Add or Update Project
        if (status === "adding") {
          setIsLoading(true);
          await onProjectAdd(projectName, projectDescription, rate);
          changeStatus("selecting");
        } else if (status === "updating") {
          if (selectedProjectId === null) {
            throw new Error("Selected value cannot be empty.");
          }
          setIsLoading(true);
          await onProjectEdit(
            Number(selectedProjectId),
            projectName,
            projectDescription,
            rate,
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
      <form onSubmit={handleSaveProject}>
        {/* Form Header */}
        <label className="form-label fw-bold mb-4">
          {status === "updating" ? "Edit Project" : "Add Project"}
        </label>

        {/* Project Name */}
        <div className="form-group mb-3">
          <label htmlFor="projectNameInput">Project Name</label>
          <input
            type="text"
            maxLength={100}
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            id="projectNameInput"
            placeholder="Enter project name"
            value={projectName}
            onChange={(e) => {
              setErrors((previous) => ({
                ...previous,
                name: undefined,
              }));
              setProjectName(e.target.value);
            }}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        {/* Project Description */}
        <div className="form-group mb-3">
          <label htmlFor="projectDescriptionInput">
            Description (optional)
          </label>
          <textarea
            className="form-control"
            maxLength={500}
            id="projectDescriptionInput"
            placeholder="Describe the project"
            value={projectDescription}
            onChange={(e) => {
              setProjectDescription(e.target.value);
            }}
          />
        </div>

        {/* Hourly Rate */}
        <div className="form-group mb-3">
          <label htmlFor="projectRateInput">Hourly Rate ($)</label>
          <input
            type="number"
            step="0.01"
            className={`form-control ${errors.rate ? "is-invalid" : ""}`}
            id="projectRateInput"
            disabled={isLoading}
            value={projectRate}
            onChange={(e) => {
              setErrors((previous) => ({
                ...previous,
                rate: undefined,
              }));
              setProjectRate(e.target.value);
            }}
          />
          {errors.rate && <div className="invalid-feedback">{errors.rate}</div>}
        </div>

        {/* Project Archive Status */}
        {status === "updating" && (
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="archiveProjectCheckbox"
              disabled={isLoading}
              checked={isArchived}
              onChange={(e) => {
                setIsArchived(e.target.checked);
              }}
            />
            <label
              className="form-check-label"
              htmlFor="archiveProjectCheckbox"
            >
              Archive Project
            </label>
          </div>
        )}

        {/* Form Actions */}
        <div className="d-flex justify-content-end gap-2">
          {hasProjects() && (
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={isLoading}
              onClick={() => {
                setErrors({});
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
            {status === "adding" ? "Add Project" : "Update Project"}
          </button>
        </div>
      </form>
    );
  }

  // Project Selection Dropdown
  function renderSelect() {
    // Handle Project Selection
    async function handleProjectChange(
      e: React.ChangeEvent<HTMLSelectElement>,
    ): Promise<void> {
      try {
        setErrorMsg("");
        setIsLoading(true);
        await onProjectChange(Number(e.target.value));
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
          {/* Project Dropdown */}
          <select
            className="form-select rounded-4"
            disabled={isLoading}
            value={selectedProjectId == null ? "" : Number(selectedProjectId)}
            onChange={handleProjectChange}
          >
            <option value="" disabled hidden>
              Select a project
            </option>
            {visibleProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
                {project.isArchived ? " (Archived)" : ""}
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

          {/* Edit Project */}
          {selectedProjectId !== null && (
            <button
              type="button"
              className="btn btn-outline-primary rounded-circle"
              title="Edit Project"
              aria-label="Edit Project"
              disabled={isLoading}
              onClick={() => {
                const projectToEdit = projectList.find(
                  (project) => project.id === selectedProjectId,
                );
                if (!projectToEdit) throw new Error("No project selected.");

                setProjectName(projectToEdit.name);
                setProjectDescription(projectToEdit.description ?? "");
                setProjectRate(String(projectToEdit.rate));
                setIsArchived(projectToEdit.isArchived);
                changeStatus("updating");
              }}
            >
              <i className="bi bi-pencil"></i>
            </button>
          )}

          {/* Add Project */}
          <button
            type="button"
            className="btn btn-primary rounded-circle"
            title="Add Project"
            aria-label="Add Project"
            disabled={isLoading}
            onClick={() => {
              ResetProject();
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
            id="showArchivedProjectCheckbox"
            checked={showArchived}
            disabled={isLoading}
            onChange={(e) => {
              onShowArchivedChange(e.target.checked);
            }}
          />
          <label
            className="form-check-label"
            htmlFor="showArchivedProjectCheckbox"
          >
            Show Archived Projects
          </label>
        </div>
      </div>
    );
  }
}
