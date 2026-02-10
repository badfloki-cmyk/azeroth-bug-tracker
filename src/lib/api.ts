const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    developer_type: string;
  };
}

interface BugReport {
  _id?: string;
  developer: string;
  wow_class: string;
  rotation: string;
  pvpve_mode: string;
  level: number;
  expansion: string;
  title: string;
  description: string;
  current_behavior: string;
  expected_behavior: string;
  logs?: string;
  video_url?: string;
  screenshot_urls?: string[];
  discord_username: string;
  sylvanas_username: string;
  priority: string;
  status: string;
  reporter_name: string;
  createdAt: string;
}

export const authAPI = {
  register: async (username: string, email: string, password: string, developer_type: string, registration_password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, developer_type, registration_password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Registration failed");
    }
    return response.json();
  },

  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Login failed");
    }
    return response.json();
  },
};

export const userAPI = {
  getProfile: async (token: string) => {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to fetch profile");
    }
    return response.json();
  },
};

export const bugAPI = {
  getAll: async (): Promise<BugReport[]> => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to fetch bugs");
    }
    return response.json();
  },

  create: async (bug: BugReport, token: string) => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bug),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to create bug report");
    }
    return response.json();
  },

  updateStatus: async (ticketId: string, status: string, token: string, resolveReason?: string) => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: ticketId, status, ...(resolveReason ? { resolveReason } : {}) }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to update status");
    }
    return response.json();
  },

  delete: async (ticketId: string, token: string, hardDelete: boolean = false) => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: ticketId, hardDelete }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to delete bug report");
    }
    return response.json();
  },

  update: async (bug: BugReport, token: string) => {
    const response = await fetch(`${API_URL}/api/bugs/tickets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bug),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to update bug report");
    }
    return response.json();
  },
};

export const codeChangeAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/code-changes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to fetch code changes");
    }
    return response.json();
  },

  create: async (change: { file_path: string; change_description: string; change_type: string; related_ticket_id?: string; github_url?: string }, token: string) => {
    const response = await fetch(`${API_URL}/api/code-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(change),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to create code change");
    }
    return response.json();
  },

  delete: async (changeId: string, token: string) => {
    const response = await fetch(`${API_URL}/api/code-changes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: changeId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.details || errorData.error || "Failed to delete code change");
    }
    return response.json();
  },
};
