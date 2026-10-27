
import type { Project } from "../types/Project";

export const mockProjects: Project[] = [
    {
        id: 1,
        name: "Website Redesign",
        description: "Redesign and development of company website",
        rate: 100,
        isArchived: false,
        clientId: 1,
    },
    {
        id: 2,
        name: "Internal Dashboard",
        description: "Reporting dashboard development",
        rate: 125,
        isArchived: false,
        clientId: 1,
    },
    {
        id: 3,
        name: "Mobile Application",
        description: "Mobile application development",
        rate: 110,
        isArchived: false,
        clientId: 2,
    },
];
