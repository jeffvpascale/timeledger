import { useState, type ChangeEvent, type SubmitEvent } from "react";
import type { Project } from "../types/Project";
import type { BillingStatus, TimeEntry } from "../types/TimeEntry";

interface TimeEntryProps {
  timeEntryList: TimeEntry[];
  selectedProject: Project | null;
  onTimeEntryAdd: (
    date: string,
    description: string,
    timeSpent: number,
    billingStatus: BillingStatus,
  ) => Promise<void>;
  onTimeEntryEdit: (
    id: number,
    date: string,
    description: string,
    timeSpent: number,
    billingStatus: BillingStatus,
  ) => Promise<void>;
  onTimeEntryEditBillingStatus: (
    id: number,
    billingStatus: BillingStatus,
  ) => Promise<void>;
  onTimeEntryDelete: (id: number) => Promise<void>;
}

// Field Validation Errors
interface TimeEntryErrors {
  date?: string;
  description?: string;
  timeSpent?: string;
}

type SortMode = "newest" | "oldest" | "hours";
// Selector Modes
type Status = "viewing" | "updating" | "adding";

function getCurrentDate(): string {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default function TimeEntry({
  timeEntryList,
  selectedProject,
  onTimeEntryAdd,
  onTimeEntryEdit,
  onTimeEntryEditBillingStatus,
  onTimeEntryDelete,
}: TimeEntryProps) {
  // Helpers
  const hasTimeEntries = () => timeEntryList.length > 0;

  // Time Entry Form State
  const [timeEntryDate, setTimeEntryDate] = useState(getCurrentDate);
  const [timeEntryDescription, setTimeEntryDescription] = useState("");
  const [timeEntryHours, setTimeEntryHours] = useState("1");
  const [timeEntryBillingStatus, setTimeEntryBillingStatus] =
    useState<BillingStatus>("unbilled");

  const [selectedTimeEntryId, setSelectedTimeEntryId] = useState<number | null>(
    null,
  );
  // Selector State
  const [status, setStatus] = useState<Status>(() =>
    hasTimeEntries() ? "viewing" : "adding",
  );
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [showBilled, setShowBilled] = useState(true);
  const [showUnbilled, setShowUnbilled] = useState(true);
  const [showNonBillable, setShowNonBillable] = useState(true);

  // Loading and Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState<TimeEntryErrors>({});
  const [loadingEntryIds, setLoadingEntryIds] = useState<Set<number>>(
    new Set(),
  );

  const filteredTimeEntryList = timeEntryList.filter(
    (te) =>
      (showBilled && te.billingStatus === "billed") ||
      (showUnbilled && te.billingStatus === "unbilled") ||
      (showNonBillable && te.billingStatus === "nonBillable"),
  );
  // Reset Project Form Fields
  function ResetTimeEntry() {
    setTimeEntryDate(getCurrentDate());
    setTimeEntryDescription("");
    setTimeEntryHours("1");
    setTimeEntryBillingStatus("unbilled");
  }
  return (
    <div className="mb-3 border-1 border p-3 p-md-5 rounded-4">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-baseline">
        <div>
          <label className="form-label fw-bold">Time Entries</label>
          <p className="small">
            {selectedProject?.name} - ${selectedProject?.rate.toFixed(2)}
          </p>
        </div>
        {status === "viewing" && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              ResetTimeEntry();
              setStatus("adding");
            }}
          >
            <i className="bi bi-plus-lg me-2"></i>Add Entry
          </button>
        )}
      </div>

      {/* Selector or Add/Edit Form */}
      {status !== "viewing" || timeEntryList.length === 0
        ? renderForm()
        : renderComponent()}

      {/* General Error Message */}
      <div
        className={`alert alert-danger fade my-3 ${errorMsg ? "show" : "d-none"}`}
      >
        <p className="text-danger mb-0">{errorMsg}</p>
      </div>
    </div>
  );

  function renderForm() {
    function handleBillingStatusChange(
      event: ChangeEvent<HTMLInputElement>,
    ): void {
      setTimeEntryBillingStatus(event.target.value as BillingStatus);
    }

    async function handleSaveTimeEntry(
      event: SubmitEvent<HTMLFormElement>,
    ): Promise<void> {
      // Save Time Entry
      try {
        event.preventDefault();
        setErrorMsg("");

        // Validate Fields
        const timeEntryErrors: TimeEntryErrors = {};
        const hours = Number(timeEntryHours);

        if (!timeEntryDescription.trim()) {
          timeEntryErrors.description = "Please enter a description.";
        }

        if (!timeEntryDate || Number.isNaN(Date.parse(timeEntryDate.trim()))) {
          timeEntryErrors.date = "Please enter a valid date.";
        }

        if (!timeEntryHours.trim() || !Number.isFinite(hours) || hours <= 0) {
          timeEntryErrors.timeSpent = "Timespent must be greater than 0.";
        }

        setErrors(timeEntryErrors);

        if (Object.keys(timeEntryErrors).length > 0) {
          return;
        }

        // Add or Update Time Entry
        if (status === "adding") {
          setIsLoading(true);
          await onTimeEntryAdd(
            timeEntryDate,
            timeEntryDescription,
            hours,
            timeEntryBillingStatus,
          );
          setStatus("viewing");
        } else if (status === "updating") {
          if (selectedTimeEntryId === null) {
            throw new Error("Selected value cannot be empty.");
          }
          setIsLoading(true);
          await onTimeEntryEdit(
            selectedTimeEntryId,
            timeEntryDate,
            timeEntryDescription,
            hours,
            timeEntryBillingStatus,
          );
          setStatus("viewing");
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

    /* Add/Edit Time Entry Form */
    return (
      <form onSubmit={handleSaveTimeEntry} noValidate>
        {/* Form Header */}
        <label className="form-label fw-bold mb-4">
          {status === "adding" ? "Add " : "Edit "}Time Entry
        </label>

        {/* Date and Hours */}
        <div className="d-flex align-items-baseline justify-content-evenly gap-2 mb-3">
          <div className="flex-fill">
            <label htmlFor="datepicker" className="form-label m-0">
              Date
            </label>
            <input
              type="date"
              className={`form-control ${errors.date ? "is-invalid" : ""}`}
              id="datepicker"
              value={timeEntryDate}
              onChange={(e) => {
                setErrors((previous) => ({
                  ...previous,
                  date: undefined,
                }));
                setTimeEntryDate(e.target.value);
              }}
            />
            {errors.date && (
              <div className="invalid-feedback">{errors.date}</div>
            )}
          </div>
          <div className="flex-fill">
            <label htmlFor="hoursInput" className="form-label m-0">
              Hours
            </label>
            <input
              id="hoursInput"
              type="number"
              className={`form-control ${errors.timeSpent ? "is-invalid" : ""}`}
              min="0"
              step="0.25"
              placeholder="1.00"
              value={timeEntryHours}
              onChange={(e) => {
                setErrors((previous) => ({
                  ...previous,
                  timeSpent: undefined,
                }));
                setTimeEntryHours(e.target.value);
              }}
            />
            {errors.timeSpent && (
              <div className="invalid-feedback">{errors.timeSpent}</div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-3">
          <label htmlFor="descriptionTextArea" className="form-label">
            Description
          </label>
          <textarea
            className={`form-control ${errors.description ? "is-invalid" : ""}`}
            id="descriptionTextArea"
            rows={3}
            value={timeEntryDescription}
            onChange={(e) => {
              setErrors((previous) => ({
                ...previous,
                description: undefined,
              }));
              setTimeEntryDescription(e.target.value);
            }}
          />
          {errors.description && (
            <div className="invalid-feedback">{errors.description}</div>
          )}
        </div>

        {/* Billing Status */}
        <fieldset>
          <legend className="form-label fs-6">Billing Status</legend>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="billingStatusRadioGroup"
              id="unBilledRadioButton"
              value="unbilled"
              checked={timeEntryBillingStatus === "unbilled"}
              onChange={handleBillingStatusChange}
            />
            <label className="form-check-label" htmlFor="unBilledRadioButton">
              Unbilled
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="billingStatusRadioGroup"
              id="billedRadioButton"
              value="billed"
              checked={timeEntryBillingStatus === "billed"}
              onChange={handleBillingStatusChange}
            />
            <label className="form-check-label" htmlFor="billedRadioButton">
              Billed
            </label>
          </div>

          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="billingStatusRadioGroup"
              id="nonbillableRadioButton"
              value="nonBillable"
              checked={timeEntryBillingStatus === "nonBillable"}
              onChange={handleBillingStatusChange}
            />
            <label
              className="form-check-label"
              htmlFor="nonbillableRadioButton"
            >
              Non-Billable
            </label>
          </div>
        </fieldset>

        {/* Form Actions */}
        <div className="d-flex justify-content-end align-items-center gap-2">
          {hasTimeEntries() && (
            <button
              type="button"
              className="btn btn-outline-primary"
              disabled={isLoading}
              onClick={() => {
                setErrors({});
                setStatus("viewing");
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
            {status == "adding" ? "Add " : "Update "} Entry
          </button>
        </div>
      </form>
    );
  }
  function renderComponent() {
    function formatDate(date: string): string {
      const [year, month, day] = date.split("-");
      return `${month}/${day}/${year.slice(-2)}`;
    }
    async function handleDeleteButtonClick(id: number): Promise<void> {
      if (!window.confirm("Delete this time entry?")) return;

      setLoadingEntryIds((prev) => new Set(prev).add(id));

      try {
        await onTimeEntryDelete(id);
        if (timeEntryList.length === 1) {
          ResetTimeEntry();
          setStatus("adding");
        }
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Delete failed.");
      } finally {
        setLoadingEntryIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }

    function handleEditButtonClick(entry: TimeEntry): void {
      setTimeEntryDate(entry.date);
      setTimeEntryDescription(entry.description);
      setTimeEntryHours(String(entry.timeSpent));
      setTimeEntryBillingStatus(entry.billingStatus);
      setStatus("updating");
      setSelectedTimeEntryId(entry.id);
    }
    async function handleBillingStatusChange(
      timeEntry: TimeEntry,
      billingStatus: BillingStatus,
    ): Promise<void> {
      setLoadingEntryIds((prev) => new Set(prev).add(timeEntry.id));

      try {
        await onTimeEntryEditBillingStatus(timeEntry.id, billingStatus);
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Update failed.");
      } finally {
        setLoadingEntryIds((prev) => {
          const next = new Set(prev);
          next.delete(timeEntry.id);
          return next;
        });
      }
    }
    const totalHours = timeEntryList.reduce(
      (sum, entry) => sum + entry.timeSpent,
      0,
    );

    const billableHours = timeEntryList
      .filter((entry) => entry.billingStatus !== "nonBillable")
      .reduce((sum, entry) => sum + entry.timeSpent, 0);

    const effectiveRate =
      totalHours > 0
        ? (billableHours * (selectedProject?.rate ?? 0)) / totalHours
        : 0;
    return (
      <>
        {/* Billing Summary */}
        <div className="row row-cols-2 row-cols-md-4 g-3 mb-4">
          <div className="col text-center">
            <p className="small m-0">Effective Rate</p>
            <p className="fw-bold m-0">${effectiveRate.toFixed(2)}</p>
          </div>
          <div className="col text-center">
            <p className="small m-0">Unbilled</p>
            <p className="fw-bold m-0">
              $
              {timeEntryList
                .filter((timeEntry) => timeEntry.billingStatus === "unbilled")
                .reduce(
                  (sum, entry) =>
                    sum + entry.timeSpent * (selectedProject?.rate ?? 0),
                  0,
                )
                .toFixed(2)}
            </p>
            <p className="small m-0">
              {timeEntryList
                .filter((timeEntry) => timeEntry.billingStatus === "unbilled")
                .reduce((sum, entry) => sum + entry?.timeSpent, 0)
                .toFixed(2)}
              {" hrs"}
            </p>
          </div>
          <div className="col text-center">
            <p className="small m-0">Billed</p>
            <p className="fw-bold m-0">
              $
              {timeEntryList
                .filter((timeEntry) => timeEntry.billingStatus === "billed")
                .reduce(
                  (sum, entry) =>
                    sum + entry.timeSpent * (selectedProject?.rate ?? 0),
                  0,
                )
                .toFixed(2)}
            </p>
            <p className="small m-0">
              {timeEntryList
                .filter((timeEntry) => timeEntry.billingStatus === "billed")
                .reduce((sum, entry) => sum + entry?.timeSpent, 0)
                .toFixed(2)}
              {" hrs"}
            </p>
          </div>
          <div className="col text-center">
            <p className="small m-0">Non-billable</p>
            <p className="fw-bold m-0">
              {timeEntryList
                .filter(
                  (timeEntry) => timeEntry.billingStatus === "nonBillable",
                )
                .reduce((sum, entry) => sum + entry?.timeSpent, 0)
                .toFixed(2)}
            </p>
            <p className="small m-0">{" hrs"}</p>
          </div>
        </div>

        {/* Entry Count and Sorting */}
        <div className="d-flex flex-column flex-xl-row justify-content-between align-items-stretch align-items-xl-center gap-3 mb-3">
          <p className="small m-0 order-last order-xl-first">
            {filteredTimeEntryList.length + " entries · "}
            {filteredTimeEntryList
              .reduce((sum, entry) => sum + entry?.timeSpent, 0)
              .toFixed(2) + " total hours"}
          </p>
          <div className="d-flex align-items-center gap-2">
            <p className="small m-0">Show</p>
            <div className="d-flex flex-wrap gap-2 border border-1 border-secondary rounded-1 p-2">
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showBilledCheckbox"
                  checked={showBilled}
                  onChange={(e) => setShowBilled(e.target.checked)}
                />
                <label
                  className="form-check-label"
                  htmlFor="showBilledCheckbox"
                >
                  Billed
                </label>
              </div>

              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showuUnbilledCheckbox"
                  checked={showUnbilled}
                  onChange={(e) => setShowUnbilled(e.target.checked)}
                />
                <label
                  className="form-check-label"
                  htmlFor="showuUnbilledCheckbox"
                >
                  Unbilled
                </label>
              </div>

              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showuNonBillableCheckbox"
                  checked={showNonBillable}
                  onChange={(e) => setShowNonBillable(e.target.checked)}
                />
                <label
                  className="form-check-label"
                  htmlFor="showuNonBillableCheckbox"
                >
                  Non-Billable
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label htmlFor="timeEntrySort" className="small m-0">Sort</label>
            <select
              id="timeEntrySort"
              className="form-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="hours">Most hours</option>
            </select>
          </div>
        </div>

        {/* Time Entries Table */}
        <div className="table-responsive rounded-2">
          <table className="table table-bordered mb-0">
            <thead>
              <tr className="table-primary">
                <th className="small col-1" scope="col">
                  Date
                </th>
                <th className="small col-6" scope="col">
                  Description
                </th>
                <th className="small col-1" scope="col">
                  Hours
                </th>
                <th className="small col-2" scope="col">
                  Status
                </th>
                <th className="small col-2" scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {[...filteredTimeEntryList]
                .sort((a, b) => {
                  switch (sortMode) {
                    case "newest":
                      return b.date.localeCompare(a.date);
                    case "oldest":
                      return a.date.localeCompare(b.date);
                    case "hours":
                      return b.timeSpent - a.timeSpent;
                    default:
                      return 0;
                  }
                })
                .map((timeEntry) => (
                  <tr
                    className={`align-middle ${timeEntry.billingStatus === "billed" ? "table-success" : timeEntry.billingStatus === "unbilled" ? "table-danger" : "table-secondary"}`}
                    key={timeEntry.id}
                  >
                    <td className="small">{formatDate(timeEntry.date)}</td>
                    <td>{timeEntry.description}</td>
                    <td>{timeEntry.timeSpent}</td>
                    <td>
                      <select
                        className="form-select"
                        value={timeEntry.billingStatus}
                        onChange={async (e) => {
                          handleBillingStatusChange(
                            timeEntry,
                            e.target.value as BillingStatus,
                          );
                        }}
                        disabled={loadingEntryIds.has(timeEntry.id)}
                      >
                        <option value="unbilled">Unbilled</option>
                        <option value="billed">Billed</option>
                        <option value="nonBillable">Non-Billable</option>
                      </select>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary rounded-circle"
                          title="Edit Entry"
                          aria-label="Edit Entry"
                          onClick={() => {
                            handleEditButtonClick(timeEntry);
                          }}
                          disabled={loadingEntryIds.has(timeEntry.id)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger rounded-circle"
                          title="Delete Entry"
                          aria-label="Delete Entry"
                          onClick={() => handleDeleteButtonClick(timeEntry.id)}
                          disabled={loadingEntryIds.has(timeEntry.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}
