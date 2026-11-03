import type { Client } from "../types/Client";
import { apiClient } from "./apiService";
import * as mockService from "./MockServices/MockClientService";
import { useMocks } from "./serviceConfig";

const endPoint = "/client"

export async function getClients(): Promise<Client[]> {
    if (useMocks) return mockService.getClients();
    const clients = await apiClient.get<Client[]>(`${endPoint}`);
    return clients;
}

export async function addClient(name: string): Promise<Client> {
    if (useMocks) return mockService.addClient(name);
    const newClient = await apiClient.post<Client>(`${endPoint}`, { name })
    return newClient;
}

export async function updateClient(id: number, name: string, isArchived: boolean): Promise<Client> {
    if (useMocks) return mockService.updateClient(id, name, isArchived);

    const updatedClient = await apiClient.put<Client>(`${endPoint}/${id}`, { name, isArchived });
    return updatedClient;
}
