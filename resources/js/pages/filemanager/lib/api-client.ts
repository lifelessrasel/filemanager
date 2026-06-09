import axios from 'axios';

type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
};

function readErrorBody(data: unknown): ApiErrorBody | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return data as ApiErrorBody;
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again.';
  }

  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Check your connection and try again.';
  }

  const body = readErrorBody(error.response?.data);

  if (body?.errors) {
    for (const messages of Object.values(body.errors)) {
      if (messages?.[0]) {
        return messages[0];
      }
    }
  }

  if (body?.error) {
    return body.error;
  }

  if (body?.message) {
    return body.message;
  }

  if (typeof error.response?.data === 'string' && error.response.data.trim() !== '') {
    return error.response.data.trim().slice(0, 300);
  }

  if (error.response?.status === 419) {
    return 'Session expired. Refresh the page and try again.';
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.response?.status === 413) {
    return 'The file is too large for the server upload limit.';
  }

  if (error.response?.status) {
    return `Request failed (${error.response.status}). Please try again.`;
  }

  return 'Something went wrong. Please try again.';
}

export function fileManagerHeaders(csrfToken: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'X-CSRF-TOKEN': csrfToken,
    'X-Requested-With': 'XMLHttpRequest',
  };
}

export async function postJson<T>(csrfToken: string, url: string, data: Record<string, unknown>): Promise<T> {
  const response = await axios.post<T>(url, data, { headers: fileManagerHeaders(csrfToken) });

  return response.data;
}

export async function postFormData<T>(csrfToken: string, url: string, data: FormData): Promise<T> {
  data.append('_token', csrfToken);

  const response = await axios.post<T>(url, data, { headers: fileManagerHeaders(csrfToken) });

  return response.data;
}

export async function putJson<T>(csrfToken: string, url: string, data: Record<string, unknown>): Promise<T> {
  const response = await axios.put<T>(url, data, { headers: fileManagerHeaders(csrfToken) });

  return response.data;
}
