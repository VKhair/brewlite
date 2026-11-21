export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`/api/backend${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Không thể kết nối máy chủ. Hãy kiểm tra backend đang chạy.",
      0,
    );
  }
  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const first = json?.message;
    throw new ApiError(
      typeof first === "string"
        ? first
        : Array.isArray(first)
          ? first.join(", ")
          : "Có lỗi xảy ra, vui lòng thử lại.",
      response.status,
    );
  }
  return json as T;
}
