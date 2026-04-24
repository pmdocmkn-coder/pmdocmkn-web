/**
 * API Proxy untuk bypass CORS issues
 * Forward requests ke backend API
 */

const BACKEND_URL = "https://api.mknops.web.id";

export const proxyFetch = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const url = `${BACKEND_URL}${endpoint}`;

  console.log("[v0] Proxy request:", {
    method: options.method || "GET",
    url,
    headers: options.headers,
  });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      mode: "cors",
      credentials: "include",
    });

    console.log("[v0] Proxy response:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("[v0] Proxy error response:", errorData);
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    console.error("[v0] Proxy fetch error:", error);
    throw error;
  }
};
