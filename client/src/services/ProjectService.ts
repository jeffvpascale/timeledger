import type { Project } from './../types/Project';
import { apiClient } from './apiService';
import * as mockService from './MockServices/MockProjectService';
import { useMocks } from './serviceConfig';

const endPoint = "/project"

export async function getProjectsByClientId(clientId: number): Promise<Project[]> {
    if (useMocks) return mockService.getProjectsByClientId(clientId);
    const projects = await apiClient.get<Project[]>(`${endPoint}/${clientId}`);
    return projects;
}

export async function addProject(name: string, description: string, rate: number, clientId: number): Promise<Project> {
    if (useMocks) return mockService.addProject(name, description, rate, clientId);
    const newProject = await apiClient.post<Project>(`${endPoint}`, { name, description, rate, clientId });
    return newProject;
}

export async function updateProject(id: number, name: string, description: string, rate: number, isArchived: boolean): Promise<Project> {
    if (useMocks) return mockService.updateProject(id, name, description, rate, isArchived);
    const updatedProject = await apiClient.put<Project>(`${endPoint}/${id}`, { name, description, rate, isArchived });
    return updatedProject;
}
