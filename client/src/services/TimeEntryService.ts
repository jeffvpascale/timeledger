import { type TimeEntry, type BillingStatus } from '../types/TimeEntry';
import { apiClient } from './apiService';
import * as mockService from './MockServices/MockTimeEntryService';
import { useMocks } from './serviceConfig';

const endPoint = "/time-entry";

export async function getTimeEntriesByProjectId(projectId: number): Promise<TimeEntry[]> {
    if (useMocks) return mockService.getTimeEntriesByProjectId(projectId);
    const timeEntries = await apiClient.get<TimeEntry[]>(`${endPoint}/${projectId}`);
    return timeEntries;
}
export async function addTimeEntry(date: string, description: string, timeSpent: number, billingStatus: BillingStatus, projectId: number): Promise<TimeEntry> {
    if (useMocks) return mockService.addTimeEntry(date, description, timeSpent, billingStatus, projectId);
    const newTimeEntry = await apiClient.post<TimeEntry>(`${endPoint}`, { date, description, timeSpent, billingStatus, projectId });
    return newTimeEntry;
}

export async function updateTimeEntry(id: number, date: string, description: string, timeSpent: number, billingStatus: BillingStatus): Promise<TimeEntry> {
    if (useMocks) return mockService.updateTimeEntry(id, date, description, timeSpent, billingStatus);

    const updatedTimeEntry = await apiClient.put<TimeEntry>(`${endPoint}/${id}`, { date, description, timeSpent, billingStatus });
    return updatedTimeEntry
}

export async function updateBillingStatus(id: number, billingStatus: BillingStatus): Promise<TimeEntry> {
    if (useMocks) return mockService.updateBillingStatus(id, billingStatus);

    const updatedTimeEntry = await apiClient.patch<TimeEntry>(`${endPoint}/${id}`, billingStatus);
    return updatedTimeEntry
}

export async function deleteTimeEntry(id: number): Promise<void> {
    if (useMocks) return mockService.deleteTimeEntry(id);
    await apiClient.delete(`${endPoint}/${id}`);
}
