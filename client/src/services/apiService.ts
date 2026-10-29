
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

function requestSignal(signal?: AbortSignal): AbortSignal {
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    return signal ? AbortSignal.any([signal, timeout]) : timeout;
}


async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.message || `HTTP error! status: ${response.status}`,
            response.status
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

export const apiClient = {
    async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            signal: requestSignal(signal),
        });
        return handleResponse<T>(response);
    },

    async post<T>(endpoint: string, data: unknown): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            signal: requestSignal(),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        return handleResponse<T>(response);
    },

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PUT",
            signal: requestSignal(),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        return handleResponse<T>(response);
    },

    async patch<T>(endpoint: string, data: unknown): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PATCH",
            signal: requestSignal(),
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        return handleResponse<T>(response);
    },

    async delete(endpoint: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "DELETE",
            signal: requestSignal(),
        });

        await handleResponse<void>(response);
    },
};
