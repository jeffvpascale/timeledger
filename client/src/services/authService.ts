import { type User } from "../types/User";
import { apiClient } from "./apiService";


export async function loginUser(email: string, password: string): Promise<void> {

}

export async function registerUser(firstName: string, lastName: string, company: string, email: string, password: string): Promise<void> {

}

export async function logoutUser(): Promise<void> {

}


export async function getUser(): Promise<User | null> {

}

export async function editUser(firstName: string, lastName: string, company: string, email: string): Promise<User> {


}

export async function editPassword(currentPassword: string, newPassword: string): Promise<void> {

}