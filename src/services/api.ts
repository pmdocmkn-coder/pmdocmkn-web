import axios from "axios";
import { LoginRequest, User } from "../types/auth";
import {
  DailySummary,
  UploadCsvResponse,
  CallRecord,
  CallRecordsResponse,
  FleetStatisticType,
  FleetStatisticsDto,
} from "../types/callRecord";
import {
  CreatePermissionRequest,
  CreateRoleRequest,
  Permission,
  Role,
  RolePermission,
  RolePermissionMatrix,
} from "../types/permission";
import { number } from "framer-motion";

// Determine base URL based on environment
const getBaseURL = () => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_URL || "http://localhost:5116";
  }
  return import.meta.env.VITE_API_URL || "https://api.mknops.web.id";
  
};
// ✅ DEFAULT API INSTANCE (60 second timeout)
export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  withCredentials: false,
});

// ✅ LONG RUNNING API INSTANCE (5 minute timeout for CSV import)
export const apiLongRunning = axios.create({
  baseURL: getBaseURL(),
  timeout: 300000,
  withCredentials: false,
});

// Request interceptor
const requestInterceptor = (config: any) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  console.log("🚀 API Request:", {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
  });

  return config;
};

// Response interceptor
const responseInterceptor = (response: any) => {
  console.log("✅ API Response Success:", {
    status: response.status,
    url: response.config.url,
    data: response.data,
  });

  return response;
};

const errorInterceptor = (error: any) => {
  console.error("❌ API Response Error:", {
    status: error.response?.status,
    message: error.message,
    code: error.code,
    url: error.config?.url,
    response: error.response?.data,
    method: error.config?.method,
    statusText: error.response?.statusText,
    data: error.response?.data,
    headers: error.config?.headers,
  });

  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    console.error("🌐 Network Error Details:");
    console.error("- Backend URL:", getBaseURL());
    console.error("- Environment:", import.meta.env.MODE);
    console.error("- VITE_API_URL:", import.meta.env.VITE_API_URL);

    throw new Error(
      "Tidak dapat terhubung ke server. Periksa:\n1. Backend server sedang berjalan\n2. Koneksi internet stabil\n3. CORS configuration di backend"
    );
  }

  if (error.response?.status === 401) {
    console.warn("🛑 Unauthorized - Redirect to login");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
  } else if (error.response?.status === 403) {
    console.warn("🚫 Forbidden - Insufficient permissions");
  }

  return Promise.reject(error);
};

// Apply interceptors
api.interceptors.request.use(requestInterceptor, (error) =>
  Promise.reject(error)
);
apiLongRunning.interceptors.request.use(requestInterceptor, (error) =>
  Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === "ERR_NETWORK" && error.config && !error.config._retry) {
      error.config._retry = true;
      console.log("🔄 Retrying request...");
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s
      return api.request(error.config); // Retry once
    }
    return Promise.reject(error);
  }
);

// Test connection function
export const testConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log("🔗 Testing connection to:", getBaseURL());
    const response = await api.get("/api/auth/profile", {
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });
    console.log("🔗 Connection test response status:", response.status);
    return {
      success: true,
      message: `Server connected (Status: ${response.status})`,
    };
  } catch (error: any) {
    console.error("🔗 Connection test failed:", error);
    return {
      success: false,
      message: error.message || "Failed to connect to server",
    };
  }
};

// ============================================
// AUTH API
// ============================================

export const authApi = {
  login: async (credentials: LoginRequest) => {
    try {
      console.log("🔐 Login attempt to:", `${getBaseURL()}/api/auth/login`);

      const response = await api.post("/api/auth/login", credentials);
      console.log("🔐 Login response received:", response.data);

      // ✅ Backend now returns camelCase: { statusCode, message, data: { token, user, permissions }, meta }
      const data = response.data.data;

      if (!data || !data.token || !data.user) {
        console.error("❌ Invalid response structure:", response.data);
        throw new Error("Invalid response structure from server");
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem(
        "permissions",
        JSON.stringify(data.permissions || [])
      );

      console.log("🔐 Login successful, user:", data.user.fullName);
      return data;
    } catch (error: any) {
      console.error("❌ Login API error:", error);

      if (error.code === "ERR_NETWORK") {
        throw new Error(
          "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan dan dapat diakses."
        );
      }

      const errorMessage =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message;
      throw new Error(errorMessage || "Login failed");
    }
  },

  getProfile: async (): Promise<User> => {
    console.log("📡 Fetching user profile...");
    const response = await api.get("/api/auth/profile");
    console.log("✅ Profile response:", response.data);

    const userData = response.data.data;

    if (!userData || !userData.userId) {
      throw new Error("Invalid user data received from server");
    }

    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  },

  uploadProfilePhoto: async (
    userId: number,
    file: File
  ): Promise<{ photoUrl: string }> => {
    const formData = new FormData();
    formData.append("photo", file);

    console.log("📤 Uploading photo for user:", userId);

    const response = await api.post(`/api/users/${userId}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("📤 Photo upload response:", response.data);

    const photoUrl = response.data.data?.photoUrl;

    if (!photoUrl) {
      console.error("❌ No photoUrl in response:", response.data);
      throw new Error("PhotoUrl not found in response");
    }

    console.log("✅ Photo uploaded successfully:", photoUrl);
    return { photoUrl };
  },

  deleteProfilePhoto: async (userId: number): Promise<void> => {
    console.log("🗑️ Deleting photo for user:", userId);
    await api.delete(`/api/users/${userId}/photo`);
    console.log("✅ Photo deleted successfully");
  },

  updateProfile: async (
    userId: number,
    profileData: {
      fullName?: string;
      email?: string;
    }
  ): Promise<User> => {
    console.log("📝 Updating profile for user:", userId, profileData);
    const response = await api.put(`/api/users/${userId}`, profileData);
    console.log("✅ Profile updated:", response.data);

    return response.data.data;
  },

  getPermissions: (): string[] => {
    const permissionsStr = localStorage.getItem("permissions");
    return permissionsStr ? JSON.parse(permissionsStr) : [];
  },

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }): Promise<void> => {
    console.log("📤 Sending register request:", {
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
    });

    const requestData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password,
      fullName: userData.fullName,
    };

    try {
      const response = await api.post("/api/auth/register", requestData);
      console.log("✅ Register response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Register error:", error.response?.data);

      const responseData = error.response?.data;

      if (!responseData) {
        throw new Error("Tidak dapat terhubung ke server");
      }

      // Extract error message from standardized format
      if (responseData.data?.errors) {
        const errors = responseData.data.errors;
        const firstKey = Object.keys(errors)[0];
        const firstError = errors[firstKey];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }

      if (responseData.message && responseData.message !== "Bad Request") {
        throw new Error(responseData.message);
      }

      throw new Error("Registrasi gagal. Silakan coba lagi.");
    }
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    await api.post("/api/auth/change-password", {
      currentPassword: oldPassword,
      newPassword: newPassword,
      confirmPassword: newPassword,
    });
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    console.log("👋 Logout successful");
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await api.get("/api/auth/profile", {
        timeout: 5000,
        validateStatus: () => true,
      });
      return response.status < 500;
    } catch (error: any) {
      console.error("🔍 Health check failed:", error);
      return false;
    }
  },
};

// ============================================
// CALL RECORD API
// ============================================

export const callRecordApi = {
  getDailySummary: async (date: string): Promise<DailySummary> => {
    try {
      console.log("📡 API Call: getDailySummary", { date });
      const response = await api.get(`/api/call-records/summary/daily/${date}`);
      console.log("📊 Daily Summary Data:", response.data);

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error loading daily summary:", error);
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to load daily summary: ${errorMessage}`);
    }
  },

  getOverallSummary: async (
    startDate: string,
    endDate: string
  ): Promise<any> => {
    try {
      const response = await api.get(
        `/api/call-records/summary/overall?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error loading overall summary:", error);
      throw error;
    }
  },

  getCallRecords: async (
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 15,
    search?: string,
    callCloseReason?: number,
    hourGroup?: number,
    sortBy?: string,
    sortDir?: string
  ): Promise<CallRecordsResponse> => {
    try {
      console.log("📡 API Call: getCallRecords", {
        startDate,
        endDate,
        page,
        pageSize,
      });

      const params: any = {
        page,
        pageSize,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;
      if (callCloseReason !== undefined)
        params.callCloseReason = callCloseReason;
      if (hourGroup !== undefined) params.hourGroup = hourGroup;
      if (sortBy) params.sortBy = sortBy;
      if (sortDir) params.sortDir = sortDir;

      const response = await api.get("/api/call-records", { params });

      console.log("📊 Call Records Response:", response.data);

      // ✅ Backend returns: { statusCode, message, data: CallRecord[], meta: { pagination } }
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching call records:", error);
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to load call records: ${errorMessage}`);
    }
  },

  importCsv: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadCsvResponse> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("📤 Starting CSV import with 5 minute timeout...");

      const response = await apiLongRunning.post(
        "/api/call-records/import-csv",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log("📊 Upload progress:", percentCompleted + "%");
              onProgress?.(percentCompleted);
            }
          },
          timeout: 300000,
        }
      );

      console.log("✅ CSV import completed:", response.data);

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error importing CSV:", error);

      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Upload timeout - File terlalu besar atau koneksi lambat."
        );
      }

      throw error;
    }
  },

  exportCsv: async (startDate: string, endDate: string): Promise<void> => {
    try {
      const response = await api.get(
        `/api/call-records/export/csv?startDate=${startDate}&endDate=${endDate}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `CallRecords_${startDate}_to_${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("📤 CSV Export completed");
    } catch (error: any) {
      console.error("❌ Error exporting CSV:", error);
      throw error;
    }
  },

  exportDailyCsv: async (date: string): Promise<void> => {
    try {
      const response = await api.get(`/api/call-records/export/csv/${date}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `CallRecords_${date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("📤 Daily CSV Export completed");
    } catch (error: any) {
      console.error("❌ Error exporting daily CSV:", error);
      throw error;
    }
  },

  exportDailySummaryExcel: async (date: string): Promise<void> => {
    try {
      const response = await api.get(
        `/api/call-records/export/daily-summary/${date}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Daily_Summary_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("📤 Daily Excel Export completed");
    } catch (error: any) {
      console.error("❌ Error exporting daily Excel:", error);
      throw error;
    }
  },

  exportOverallSummaryExcel: async (
    startDate: string,
    endDate: string
  ): Promise<void> => {
    try {
      const response = await api.get(
        `/api/call-records/export/overall-summary?startDate=${startDate}&endDate=${endDate}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Overall_Summary_${startDate}_to_${endDate}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log("📤 Overall Excel Export completed");
    } catch (error: any) {
      console.error("❌ Error exporting overall Excel:", error);
      throw error;
    }
  },

  deleteCallRecords: async (date: string): Promise<boolean> => {
    try {
      console.log("🗑️ Delete API call for date:", date);

      const response = await api.delete(`/api/call-records/${date}`);

      console.log("📊 Delete API Response:", response.data);

      return response.data.data?.deleted === true;
    } catch (error: any) {
      console.error("❌ Error deleting records:", error);

      const errorMessage = error.response?.data?.message || error.message;

      if (error.response?.status === 403) {
        throw new Error(
          "Access denied: You do not have permission to delete call records"
        );
      } else if (error.response?.status === 401) {
        throw new Error("Authentication required: Please login again");
      } else {
        throw new Error(errorMessage || "Error deleting call records");
      }
    }
  },

  getFleetStatistics: async (
    date?: string,
    top: number = 10,
    type?: FleetStatisticType
  ): Promise<FleetStatisticsDto> => {
    try {
      console.log("📡 API Call: getFleetStatistics", { date, top, type });

      const params: any = { top };
      if (date) params.date = date;
      if (type && type !== FleetStatisticType.All) {
        params.type = type;
      }

      const response = await api.get("/api/call-records/fleet-statistics", {
        params,
      });
      console.log("📊 Fleet Statistics Data:", response.data);

      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error loading fleet statistics:", error);
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to load fleet statistics: ${errorMessage}`);
    }
  },
};

// ============================================
// PERMISSION API
// ============================================

export const permissionApi = {
  getAll: async (): Promise<Permission[]> => {
    const response = await api.get("/api/permissions");
    return response.data.data;
  },

  getById: async (id: number): Promise<Permission> => {
    const response = await api.get(`/api/permissions/${id}`);
    return response.data.data;
  },

  create: async (data: CreatePermissionRequest): Promise<Permission> => {
    const response = await api.post("/api/permissions", data);
    return response.data.data;
  },

  update: async (
    id: number,
    data: CreatePermissionRequest
  ): Promise<Permission> => {
    const response = await api.put(`/api/permissions/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/permissions/${id}`);
  },
};

// ============================================
// ROLE API
// ============================================

export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await api.get("/api/roles");
    return response.data.data;
  },

  getById: async (id: number): Promise<Role> => {
    const response = await api.get(`/api/roles/${id}`);
    return response.data.data;
  },

  getRolePermissions: async (id: number): Promise<Permission> => {
    const response = await api.get(`/api/roles/${id}/permissions`);
    return response.data.data;
  },

  create: async (data: CreateRoleRequest): Promise<Role> => {
    const response = await api.post("/api/roles", data);
    return response.data.data;
  },

  update: async (id: number, data: CreateRoleRequest): Promise<Role> => {
    const response = await api.put(`/api/roles/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/roles/${id}`);
  },
};

// ============================================
// ROLE-PERMISSION API
// ============================================

export const rolePermissionApi = {
  getMatrix: async (): Promise<RolePermissionMatrix[]> => {
    const response = await api.get("/api/role-permissions/matrix");
    return response.data.data;
  },

  getByRole: async (roleId: number): Promise<RolePermission[]> => {
    const response = await api.get(`/api/role-permissions/by-role/${roleId}`);
    return response.data.data;
  },

  assignPermissions: async (
    roleId: number,
    permissionIds: number[]
  ): Promise<void> => {
    await api.put(`/api/role-permissions/role/${roleId}`, { permissionIds });
  },

  removePermission: async (
    roleId: number,
    permissionId: number
  ): Promise<void> => {
    await api.delete(
      `/api/role-permissions/role/${roleId}/permission/${permissionId}`
    );
  },
};

// ============================================
// USER MANAGEMENT API
// ============================================

export const userApi = {
  getAll: async (): Promise<User[]> => {
    console.log("📡 Fetching all users...");
    const response = await api.get("/api/users");
    console.log("✅ Users fetched:", response.data);
    return response.data.data;
  },

  getById: async (id: number): Promise<User> => {
    console.log("📡 Fetching user by ID:", id);
    const response = await api.get(`/api/users/${id}`);
    console.log("✅ User fetched:", response.data);
    return response.data.data;
  },

  updateRole: async (userId: number, roleId: number): Promise<User> => {
    console.log("📝 Updating user role:", { userId, roleId });
    const response = await api.patch(`/api/users/${userId}/role`, { roleId });
    console.log("✅ User role updated:", response.data);
    return response.data.data;
  },

  activateUser: async (userId: number): Promise<User> => {
    console.log("✅ Activating user:", userId);
    const response = await api.patch(`/api/users/${userId}/activate`);
    console.log("✅ User activated:", response.data);
    return response.data.data;
  },

  deactivateUser: async (userId: number): Promise<User> => {
    console.log("🚫 Deactivating user:", userId);
    const response = await api.patch(`/api/users/${userId}/deactivate`);
    console.log("✅ User deactivated:", response.data);
    return response.data.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    console.log("🗑️ Deleting user:", userId);
    await api.delete(`/api/users/${userId}`);
    console.log("✅ User deleted successfully");
  },
};

// ============================================
// SWR SIGNAL API - FIXED VERSION
// ============================================

export const swrSignalApi = {
  // ==================== SITES ====================
  
  getSites: async () => {
    const response = await api.get("/api/swr-signal/sites");
    return response.data.data;
  },

  createSite: async (data: any) => {
    const response = await api.post("/api/swr-signal/sites", data);
    return response.data.data;
  },

  updateSite: async (data: any) => {
    const response = await api.put("/api/swr-signal/sites", data);
    return response.data.data;
  },

  deleteSite: async (id: number) => {
    await api.delete(`/api/swr-signal/sites/${id}`);
  },

  // ==================== CHANNELS ====================
  
  getChannels: async () => {
    const response = await api.get("/api/swr-signal/channels");
    return response.data.data;
  },

  createChannel: async (data: any) => {
    const response = await api.post("/api/swr-signal/channels", data);
    return response.data.data;
  },

  updateChannel: async (data: any) => {
    const response = await api.put("/api/swr-signal/channels", data);
    return response.data.data;
  },

  deleteChannel: async (id: number) => {
    await api.delete(`/api/swr-signal/channels/${id}`);
  },

  // ==================== HISTORIES (NEW!) ====================
  
  getHistories: async (query: any) => {
    const response = await api.get("/api/swr-signal/histories", {
      params: query,
    });
    // Backend returns PagedResultDto<SwrHistoryItemDto>
    return response.data;
  },

  getHistoryById: async (id: number) => {
    const response = await api.get(`/api/swr-signal/histories/${id}`);
    return response.data.data;
  },

  createHistory: async (data: any) => {
    const response = await api.post("/api/swr-signal/histories", data);
    return response.data.data;
  },

  updateHistory: async (id: number, data: any) => {
    const response = await api.put(`/api/swr-signal/histories/${id}`, data);
    return response.data.data;
  },

  deleteHistory: async (id: number) => {
    await api.delete(`/api/swr-signal/histories/${id}`);
  },

  // ==================== ANALYTICS ====================
  
  getMonthly: async (year: number, month: number) => {
    const response = await api.get("/api/swr-signal/monthly", {
      params: { year, month },
    });
    return response.data.data;
  },

  getYearly: async (year: number) => {
    const response = await api.get("/api/swr-signal/yearly", {
      params: { year },
    });
    return response.data.data;
  },

  getYearlyPivot: async (year: number, site?: string) => {
    const response = await api.get("/api/swr-signal/yearly-pivot", {
      params: { year, site },
    });
    return response.data.data;
  },

  // ==================== IMPORT & EXPORT ====================
  
  importExcel: async (file: File) => {
    const formData = new FormData();
    formData.append("excelFile", file);

    const response = await api.post(
      "/api/swr-signal/import-pivot-excel",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      }
    );
    return response.data.data;
  },

  exportYearlyExcel: async (year: number, site?: string) => {
    const url = site
      ? `/api/swr-signal/export-yearly-excel?year=${year}&site=${encodeURIComponent(site)}`
      : `/api/swr-signal/export-yearly-excel?year=${year}`;

    const response = await api.get(url, { responseType: "blob" });
    return response.data;
  },
};