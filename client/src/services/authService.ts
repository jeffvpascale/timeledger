import { type User } from "../types/User";
import { apiClient } from "./apiService";

const endPoint = "/auth"

export async function loginUser(email: string, password: string, shouldRemember: boolean): Promise<User> {
    const user = await apiClient.post<User>(`${endPoint}/login`, { email, password, shouldRemember });
    return user;
}

export async function registerUser(firstName: string, lastName: string, company: string, email: string, password: string): Promise<void> {
    await apiClient.post(`${endPoint}/register`, { firstName, lastName, company, email, password });
}

export async function logoutUser(): Promise<void> {
    await apiClient.post(`${endPoint}/logout`, null)
}


export async function getUser(): Promise<User | null> {
    const user = await apiClient.get<User>(`${endPoint}/me`);
    return user;
}

export async function editUser(firstName: string, lastName: string, company: string, email: string): Promise<User> {
    const user = await apiClient.patch<User>(`${endPoint}/details`, { firstName, lastName, company, email });
    return user;

}

export async function editPassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.patch(`${endPoint}/password`, { currentPassword, newPassword });
}