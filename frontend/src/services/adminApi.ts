import { BASE_URL, maybeHandleExpire } from "./apiBase";

export const listUsers = async () => {
  const response = await fetch(`${BASE_URL}/admin/users`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => {
  const response = await fetch(`${BASE_URL}/admin/users/create`, {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      must_change_password: true,
    }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const updateUser = async (
  userId: number,
  data: { name?: string; email?: string; role?: string }
) => {
  const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const deleteUser = async (userId: number) => {
  const response = await fetch(`${BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

// Keep backward-compatible export
export const createTeacherAccount = async (
  name: string,
  email: string,
  password: string
) => {
  return createUser({ name, email, password, role: "teacher" });
};
