
import type { TimeEntry } from "../types/TimeEntry";

export const mockTimeEntries: TimeEntry[] = [
    {
        id: 1,
        projectId: 1,
        date: "2026-10-15",
        description: "Initial design and layout",
        timeSpent: 2.5,
        billingStatus: "billed",
    },
    {
        id: 2,
        projectId: 1,
        date: "2026-10-16",
        description: "Frontend development",
        timeSpent: 4,
        billingStatus: "unbilled",
    },
    {
        id: 3,
        projectId: 1,
        date: "2026-10-19",
        description: "Testing and bug fixes",
        timeSpent: 1.75,
        billingStatus: "unbilled",
    },
    {
        id: 4,
        projectId: 1,
        date: "2026-10-20",
        description: "Project planning meeting",
        timeSpent: 1,
        billingStatus: "nonBillable",
    },
];
