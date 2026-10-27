import type { Client } from "../../types/Client";
import { mockClients } from "../../data/mockClients";

const DELAY = 500;

export async function getClients(): Promise<Client[]> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    return [...mockClients];
}


export async function addClient(name: string): Promise<Client> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const nextId = Math.max(-1, ...mockClients.map(client => client.id)) + 1;
    const newClient = { id: nextId, name, isArchived: false };
    mockClients.push(newClient);
    return newClient;
}

export async function updateClient(id: number, name: string, isArchived: boolean): Promise<Client> {
    await new Promise((resolve) => setTimeout(resolve, DELAY));
    const index = mockClients.findIndex(client => client.id === id);
    if (index === -1) {
        throw new Error("Client to update not found");
    }
    const updatedClient: Client = { ...mockClients[index], name, isArchived };
    mockClients[index] = updatedClient;
    return updatedClient;
}
