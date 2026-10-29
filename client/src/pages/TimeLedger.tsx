import { useState, useEffect } from "react";
import ClientSelector, { type Status } from "../components/ClientSelector";
import ProjectSelector from "../components/ProjectSelector";
import TimeEntryComponent from "../components/TimeEntryComponent";
import type { Client } from "../types/Client";
import type { Project } from "../types/Project";
import { getClients, updateClient, addClient } from "../services/clientService";
import {
  getProjectsByClientId,
  addProject,
  updateProject,
} from "../services/projectService";
import type { TimeEntry, BillingStatus } from "../types/TimeEntry";
import {
  addTimeEntry,
  deleteTimeEntry,
  getTimeEntriesByProjectId,
  updateTimeEntry,
  updateBillingStatus,
} from "../services/timeEntryService";
import {
  loadViewPreferences,
  saveViewPreferences,
  type ViewPreferences,
} from "../services/viewPreferences";

function TimeLedger() {
  // Development Testing Variables

  // ========================================
  // Client State
  // ========================================
  const [clientList, setClientList] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isLoadingClientList, setIsLoadingClientList] = useState(true);
  const [clientLoadError, setClientLoadError] = useState("");
  const [clientLoadAttempt, setClientLoadAttempt] = useState(0);
  // Read once at startup; keep the original selections for restoration.
  const [savedPreferences] = useState(loadViewPreferences);
  const [preferences, setPreferences] = useState(savedPreferences);
  const showArchived = preferences.showArchivedClients;
  const showArchivedProjects = preferences.showArchivedProjects;

  function updatePreferences(changes: Partial<ViewPreferences>) {
    setPreferences((previous) => ({ ...previous, ...changes }));
  }

  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [isProjectSelectorHidden, setIsProjectSelectorHidden] = useState(true);

  const [timeEntryList, setTimeEntryList] = useState<TimeEntry[]>([]);
  const [areTimeEntriesHidden, setAreTimeEntriesHidden] = useState(true);

  function clearClientSelection() {
    setSelectedClientId(null);
    setSelectedProjectId(null);
    setProjectList([]);
    setTimeEntryList([]);
    setIsProjectSelectorHidden(true);
    setAreTimeEntriesHidden(true);
  }

  function handleShowArchivedChange(checked: boolean) {
    updatePreferences({ showArchivedClients: checked });
    const selectedClient = clientList.find(
      (client) => client.id === selectedClientId,
    );
    if (!checked && selectedClient?.isArchived) {
      clearClientSelection();
    }
  }

  // Load Clients on Startup
  useEffect(() => {
    const controller = new AbortController();
    async function loadClients() {
      try {
        const clients = await getClients(controller.signal);
        if (controller.signal.aborted) return;
        setClientList(clients);

        const client = clients.find(
          (item) =>
            item.id === savedPreferences.clientId &&
            (savedPreferences.showArchivedClients || !item.isArchived),
        );
        if (!client) return;

        const projects = await getProjectsByClientId(client.id);
        if (controller.signal.aborted) return;
        setSelectedClientId(client.id);
        setProjectList(projects);
        setIsProjectSelectorHidden(false);

        const project = projects.find(
          (item) =>
            item.id === savedPreferences.projectId &&
            (savedPreferences.showArchivedProjects || !item.isArchived),
        );
        if (!project) return;

        const entries = await getTimeEntriesByProjectId(project.id);
        if (controller.signal.aborted) return;
        setSelectedProjectId(project.id);
        setTimeEntryList(entries);
        setAreTimeEntriesHidden(false);
      } catch (error) {
        if (!controller.signal.aborted) {
          setClientLoadError(
            error instanceof Error && error.name === "TimeoutError"
              ? "Loading clients took too long. Please try again."
              : "Unable to load saved view or clients. Check that the API is running and try again.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingClientList(false);
      }
    }
    void loadClients();
    return () => controller.abort();
  }, [clientLoadAttempt, savedPreferences]);

  function retryClientLoad() {
    setClientLoadError("");
    setIsLoadingClientList(true);
    setClientLoadAttempt((attempt) => attempt + 1);
  }

  // Add Client
  const handleOnClientAdd = async (name: string) => {
    const newClient = await addClient(name);
    console.log(`Client added:${newClient.name}`);
    setClientList((prev) => [...prev, newClient]);
    await handleOnClientChange(newClient.id);
  };

  // Change Selected Client
  const handleOnClientChange = async (id: number) => {
    setSelectedProjectId(null);
    setIsProjectSelectorHidden(true);
    setAreTimeEntriesHidden(true);
    setTimeEntryList([]);

    const projectsForClient = await getProjectsByClientId(id);
    setSelectedClientId(id);
    setProjectList(projectsForClient);

    setIsProjectSelectorHidden(false);
  };

  // Edit Client
  const handleOnClientEdit = async (
    id: number,
    name: string,
    isArchived: boolean,
  ) => {
    const updatedClient = await updateClient(id, name, isArchived);
    console.log(`Client edited:${updatedClient.id}:${updatedClient.name}`);
    setClientList((prev) =>
      prev
        .map((client) => (client.id === id ? updatedClient : client))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
    if (updatedClient.isArchived && !showArchived) {
      clearClientSelection();
    } else {
      setSelectedClientId(id);
    }
  };

  // Client Selector Mode Changes
  function handleClientSelectorModeChange(status: Status): void {
    setIsProjectSelectorHidden(status === "adding");
    setAreTimeEntriesHidden(status === "adding");
  }

  // ========================================
  // Project State
  // ========================================

  useEffect(() => {
    if (!isLoadingClientList && !clientLoadError) {
      saveViewPreferences({
        ...preferences,
        clientId: selectedClientId,
        projectId: selectedProjectId,
      });
    }
  }, [
    preferences,
    selectedClientId,
    selectedProjectId,
    isLoadingClientList,
    clientLoadError,
  ]);

  function clearProjectSelection() {
    setSelectedProjectId(null);
    setTimeEntryList([]);
    setAreTimeEntriesHidden(true);
  }

  function handleShowArchivedProjectsChange(checked: boolean) {
    updatePreferences({ showArchivedProjects: checked });
    const selectedProject = projectList.find(
      (project) => project.id === selectedProjectId,
    );
    if (!checked && selectedProject?.isArchived) {
      clearProjectSelection();
    }
  }

  // Add Project
  const handleOnProjectAdd = async (
    name: string,
    description: string,
    rate: number,
  ) => {
    console.log(`Project added:
      name:${name}
      desc:${description}
      rate:${rate}`);

    if (selectedClientId == null) {
      throw new Error("No client selected.");
    }

    const newProject = await addProject(
      name,
      description,
      rate,
      selectedClientId,
    );

    setProjectList((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setTimeEntryList([]);
  };

  // Change Selected Project
  const handleOnProjectChange = async (id: number) => {
    console.log(`Project changed:${id}`);

    setSelectedProjectId(id);
    setAreTimeEntriesHidden(true);

    const timeEntriesForProject = await getTimeEntriesByProjectId(id);
    setTimeEntryList(timeEntriesForProject);

    setAreTimeEntriesHidden(false);
  };

  // Edit Project
  const handleOnProjectEdit = async (
    id: number,
    name: string,
    description: string,
    rate: number,
    isArchived: boolean,
  ) => {
    console.log(`Project edited:${id}:${name}`);

    const updatedProject = await updateProject(
      id,
      name,
      description,
      rate,
      isArchived,
    );

    setProjectList((prev) =>
      prev.map((project) => (project.id === id ? updatedProject : project)),
    );

    if (updatedProject.isArchived && !showArchivedProjects) {
      clearProjectSelection();
    } else {
      setSelectedProjectId(updatedProject.id);
    }
  };

  // Project Selector Mode Changes
  function handleProjectSelectorModeChange(status: Status): void {
    setAreTimeEntriesHidden(status !== "selecting");
  }
  // ========================================
  // Time Entry State
  // ========================================

  async function handleTimeEntryAdd(
    date: string,
    description: string,
    timeSpent: number,
    billingStatus: BillingStatus,
  ): Promise<void> {
    console.log(`Time Entry added:
      date:${date}
      desc:${description}
      timeSpent:${timeSpent}
      billingStatus:${billingStatus}`);

    if (selectedProjectId == null) {
      throw new Error("No project selected.");
    }

    const newTimeEntry = await addTimeEntry(
      date,
      description,
      timeSpent,
      billingStatus,
      selectedProjectId,
    );

    setTimeEntryList((prev) => [...prev, newTimeEntry]);
  }
  async function handleTimeEntryEdit(
    id: number,
    date: string,
    description: string,
    timeSpent: number,
    billingStatus: BillingStatus,
  ): Promise<void> {
    console.log(`Time Entry edited:
      id:${id}
      date:${date}
      desc:${description}
      timeSpent:${timeSpent}
      billingStatus:${billingStatus}`);

    const editedTimeEntry = await updateTimeEntry(
      id,
      date,
      description,
      timeSpent,
      billingStatus,
    );

    setTimeEntryList((prev) =>
      prev.map((timeEntry) =>
        timeEntry.id === id ? editedTimeEntry : timeEntry,
      ),
    );
  }
  async function handleTimeEntryBillingStatusEdit(
    id: number,
    billingStatus: BillingStatus,
  ): Promise<void> {
    console.log(`Time Entry Billing Status edited:
      id:${id}
      billingStatus:${billingStatus}`);

    const editedTimeEntry = await updateBillingStatus(id, billingStatus);

    setTimeEntryList((prev) =>
      prev.map((timeEntry) =>
        timeEntry.id === id ? editedTimeEntry : timeEntry,
      ),
    );
  }

  async function handleTimeEntryDelete(id: number): Promise<void> {
    console.log(`Time Entry deleted: ${id}`);
    await deleteTimeEntry(id);
    setTimeEntryList((prev) => prev.filter((timeEntry) => timeEntry.id !== id));
  }

  // ========================================
  // Main Application Layout
  // ========================================
  return (
    <>
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary text-white rounded-3 px-4 py-3">
              <i className="bi bi-clock fs-4"></i>
            </div>
            <div>
              <h4 className="mb-0">TimeLedger</h4>
              <p className="small text-body-secondary mb-0">
                Time tracking &amp; billing
              </p>
            </div>
          </div>
        </div>
        {/* Client Selector */}
        {clientLoadError ? (
          <div className="alert alert-danger my-4" role="alert">
            <p>{clientLoadError}</p>
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={retryClientLoad}
            >
              Retry
            </button>
          </div>
        ) : !isLoadingClientList ? (
          <ClientSelector
            clientList={clientList}
            selectedClientId={selectedClientId}
            showArchived={showArchived}
            onShowArchivedChange={handleShowArchivedChange}
            onClientAdd={handleOnClientAdd}
            onClientChange={handleOnClientChange}
            onClientEdit={handleOnClientEdit}
            onModeChange={handleClientSelectorModeChange}
          />
        ) : (
          /* Client Loading Indicator */
          <div className="text-center my-4">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-2">Loading clients...</p>
          </div>
        )}

        {/* Project Selector */}
        {selectedClientId !== null && !isProjectSelectorHidden && (
          <>
            <ProjectSelector
              key={selectedClientId}
              projectList={projectList}
              selectedProjectId={selectedProjectId}
              showArchived={showArchivedProjects}
              onShowArchivedChange={handleShowArchivedProjectsChange}
              selectedClient={
                clientList.find((client) => client?.id === selectedClientId) ??
                null
              }
              onProjectAdd={handleOnProjectAdd}
              onProjectChange={handleOnProjectChange}
              onProjectEdit={handleOnProjectEdit}
              onModeChange={handleProjectSelectorModeChange}
            />
          </>
        )}

        {/* Time Entry Layout Preview */}
        {selectedProjectId !== null && !areTimeEntriesHidden && (
          <>
            <TimeEntryComponent
              key={selectedProjectId}
              preferences={preferences}
              onPreferencesChange={updatePreferences}
              timeEntryList={timeEntryList}
              selectedProject={
                projectList.find(
                  (project) => project.id === selectedProjectId,
                ) ?? null
              }
              onTimeEntryAdd={handleTimeEntryAdd}
              onTimeEntryEdit={handleTimeEntryEdit}
              onTimeEntryEditBillingStatus={handleTimeEntryBillingStatusEdit}
              onTimeEntryDelete={handleTimeEntryDelete}
            />
          </>
        )}
      </div>
    </>
  );
}

export default TimeLedger;
