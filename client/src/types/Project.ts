export interface Project {
    id: number;
    name: string;
    description?: string;
    rate: number;
    isArchived: boolean;
    clientId: number
}
