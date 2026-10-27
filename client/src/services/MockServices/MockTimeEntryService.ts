import { type TimeEntry, type BillingStatus } from './../../types/TimeEntry';
import { mockTimeEntries } from './../../data/mockTimeEntries';

const DELAY = 500;

export async function getTimeEntriesByProjectId(projectId: number): Promise<TimeEntry[]> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    return mockTimeEntries.filter(timeEntry => timeEntry.projectId === projectId);
}
export async function addTimeEntry(date: string, description: string, timeSpent: number, billingStatus: BillingStatus, projectId: number): Promise<TimeEntry> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const nextId = Math.max(-1, ...mockTimeEntries.map(timeEntry => timeEntry.id)) + 1;
    const newTimeEntry: TimeEntry = { id: nextId, date: date, description: description, timeSpent: timeSpent, billingStatus: billingStatus, projectId: projectId }
    mockTimeEntries.push(newTimeEntry);
    return newTimeEntry;
}

export async function updateTimeEntry(id: number, date: string, description: string, timeSpent: number, status: BillingStatus): Promise<TimeEntry> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const index = mockTimeEntries.findIndex(timeEntry => timeEntry.id === id);
    if (index === -1) {
        throw new Error("Time entry not found");
    }
    const updatedTimeEntry: TimeEntry = { ...mockTimeEntries[index], date: date, description: description, timeSpent: timeSpent, billingStatus: status }
    mockTimeEntries[index] = updatedTimeEntry;
    return updatedTimeEntry
}

export async function updateBillingStatus(id: number, billingStatus: BillingStatus): Promise<TimeEntry> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const index = mockTimeEntries.findIndex(timeEntry => timeEntry.id === id);
    if (index === -1) {
        throw new Error("Time entry not found.");
    }
    const updatedTimeEntry = { ...mockTimeEntries[index], billingStatus };
    mockTimeEntries[index] = updatedTimeEntry;
    return updatedTimeEntry;
}

export async function deleteTimeEntry(id: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const index = mockTimeEntries.findIndex(timeEntry => timeEntry.id === id);
    if (index === -1) {
        throw new Error("Time entry not found.");
    }
    mockTimeEntries.splice(index, 1);
}
