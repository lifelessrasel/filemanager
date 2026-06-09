import axios from 'axios';

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong. Please try again.';
  }

  const body = error.response?.data as ApiErrorBody | undefined;

  if (body?.errors) {
    for (const messages of Object.values(body.errors)) {
      if (messages?.[0]) {
        return messages[0];
      }
    }
  }

  if (body?.message) {
    return body.message;
  }

  if (error.response?.status === 419) {
    return 'Session expired. Refresh the page and try again.';
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
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
  const response = await axios.post<T>(url, data, { headers: fileManagerHeaders(csrfToken) });

  return response.data;
}

export async function putJson<T>(csrfToken: string, url: string, data: Record<string, unknown>): Promise<T> {
  const response = await axios.put<T>(url, data, { headers: fileManagerHeaders(csrfToken) });

  return response.data;
}
