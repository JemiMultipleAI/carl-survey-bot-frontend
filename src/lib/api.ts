// API client for backend communication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  },

  // Customer endpoints
  customers: {
    upload: async (formData: FormData) => {
      const url = `${API_BASE_URL}/api/customers/upload`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response.json();
    },
    create: (data: { firstName: string; lastName?: string; phoneNumber: string; companyName?: string }) =>
      apiClient.request('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => apiClient.request('/api/customers'),
  },

  // Call endpoints
  calls: {
    start: (data: { customerId: string; phoneNumber: string; firstName: string }) =>
      apiClient.request('/api/calls/start', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    batch: (data: { customerIds: string[]; maxConcurrent?: number }) =>
      apiClient.request('/api/calls/batch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (callId: string) => apiClient.request(`/api/calls/${callId}`),
    list: () => apiClient.request('/api/calls'),
    // Test call endpoint for integration testing
    test: (data: { firstName: string; phoneNumber: string }) =>
      apiClient.request('/api/calls/test', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // ElevenLabs integration endpoints
    voices: () => apiClient.request('/api/calls/voices'),
    textToSpeech: (data: { voiceId: string; text: string }) =>
      apiClient.request('/api/calls/text-to-speech', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Reports
  reports: {
    summary: () => apiClient.request('/api/reports/summary'),
    responses: () => apiClient.request('/api/reports/responses'),
  },
};
