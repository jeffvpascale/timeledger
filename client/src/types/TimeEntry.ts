export interface TimeEntry {
    id: number;
    date: string;
    description: string;
    timeSpent: number;
    billingStatus: BillingStatus;
    projectId: number;
}

export type BillingStatus = "billed" | "unbilled" | "nonBillable";
