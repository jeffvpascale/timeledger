import { mockProjects } from './../../data/mockProjects';
import type { Project } from './../../types/Project';

const DELAY = 500;

export async function getProjectsByClientId(clientId: number): Promise<Project[]> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    return mockProjects.filter(project => project.clientId === clientId);
}

export async function addProject(name: string, description: string, rate: number, clientId: number): Promise<Project> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const nextId = Math.max(-1, ...mockProjects.map(project => project.id)) + 1;
    const newProject = { id: nextId, name, description, rate, clientId, isArchived: false };
    mockProjects.push(newProject);
    return newProject;
}

export async function updateProject(id: number, name: string, description: string, rate: number, isArchived: boolean): Promise<Project> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const index = mockProjects.findIndex(project => project.id === id);
    if (index === -1) {
        throw new Error("Project to update not found");
    }
    const updatedProject: Project = { ...mockProjects[index], name, description, isArchived, rate };
    mockProjects[index] = updatedProject;
    return updatedProject;
}
