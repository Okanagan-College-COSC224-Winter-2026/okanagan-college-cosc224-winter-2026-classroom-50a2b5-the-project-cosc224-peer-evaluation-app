// src/util/api.ts

import { didExpire, removeToken } from "./login";

const BASE_URL = "http://localhost:5000";

export const maybeHandleExpire = (response: Response) => {
  if (didExpire(response)) {
    removeToken();
    window.location.href = "/";
  }
};

function getFilenameFromResponse(
  response: Response,
  fallbackName: string
): string {
  const disposition = response.headers.get("Content-Disposition");

  if (!disposition) return fallbackName;

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const normalMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return fallbackName;
}

export const tryLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    localStorage.setItem("user", JSON.stringify(json));

    return json;
  } catch (error) {
    console.error(error);
  }

  return false;
};

export async function tryRegister(
  name: string,
  email: string,
  password: string
): Promise<{ ok: boolean; msg?: string }> {
  const res = await fetch("http://127.0.0.1:5000/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, msg: data.msg || "Registration failed" };
  }

  return { ok: true };
}

export const createClass = async (name: string) => {
  const response = await fetch(`${BASE_URL}/class/create_class`, {
    method: "POST",
    body: JSON.stringify({ name }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return response;
};

export const listClasses = async () => {
  const resp = await fetch(`${BASE_URL}/class/classes`, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const importStudentsForCourse = async (
  courseID: number,
  students: string
) => {
  const response = await fetch(`${BASE_URL}/class/enroll_students`, {
    method: "POST",
    body: JSON.stringify({
      students,
      class_id: courseID,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
};

export const listAssignments = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/assignment/` + classId, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const listStuGroup = async (
  assignmentId: number,
  studentId: number
) => {
  const resp = await fetch(
    `${BASE_URL}/list_stu_groups/` + assignmentId + "/" + studentId,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const listGroups = async (assignmentId: number) => {
  const resp = await fetch(`${BASE_URL}/list_all_groups/` + assignmentId, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const listUnassignedGroups = async (assignmentId: number) => {
  const resp = await fetch(`${BASE_URL}/list_ua_groups/` + assignmentId, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(resp);

  return await resp.json();
};

export const listCourseMembers = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/class/${classId}/members`, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const listGroupMembers = async (
  assignmentId: number,
  groupID: number
) => {
  const resp = await fetch(
    `${BASE_URL}/list_group_members/` + assignmentId + "/" + groupID,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const getUserId = async () => {
  const resp = await fetch(`${BASE_URL}/user_id`, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const saveGroups = async (
  groupID: number,
  userID: number,
  assignmentID: number
) => {
  await fetch(`${BASE_URL}/save_groups`, {
    method: "POST",
    body: JSON.stringify({
      groupID,
      userID,
      assignmentID,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
};

export const getCriteria = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/criteria?rubricID=${rubricID}`, {
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const createCriteria = async (
  rubricID: number,
  question: string,
  scoreMax: number,
  canComment: boolean,
  hasScore: boolean = true
) => {
  const response = await fetch(`${BASE_URL}/create_criteria`, {
    method: "POST",
    body: JSON.stringify({
      rubricID,
      question,
      scoreMax,
      canComment,
      hasScore,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
};

export const createRubric = async (
  assignmentID: number,
  canComment: boolean
): Promise<{ id: number }> => {
  const response = await fetch(`${BASE_URL}/create_rubric`, {
    method: "POST",
    body: JSON.stringify({
      assignmentID,
      canComment,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
};

export const getRubric = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/rubric?rubricID=${rubricID}`, {
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const deleteRubric = async (rubricID: number) => {
  const response = await fetch(`${BASE_URL}/delete_rubric`, {
    method: "POST",
    body: JSON.stringify({ rubricID }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
};

export const createAssignment = async (
  courseID: number,
  name: string,
  due_date?: string | null,
  rubric?: string | null,
  file?: File | null
) => {
  const formData = new FormData();
  formData.append("courseID", String(courseID));
  formData.append("name", name);

  if (due_date) formData.append("due_date", due_date);
  if (rubric) formData.append("rubric", rubric);
  if (file) formData.append("file", file);

  const response = await fetch(`${BASE_URL}/assignment/create_assignment`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const deleteGroup = async (groupID: number) => {
  await fetch(`${BASE_URL}/delete_group`, {
    method: "POST",
    body: JSON.stringify({
      groupID,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
};

export const createReview = async (
  assignmentID: number,
  reviewerID: number,
  revieweeID: number
) => {
  const response = await fetch(`${BASE_URL}/create_review`, {
    method: "POST",
    body: JSON.stringify({
      assignmentID,
      reviewerID,
      revieweeID,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return response;
};

export const createCriterion = async (
  reviewID: number,
  criterionRowID: number,
  grade: number,
  comments: string
) => {
  const response = await fetch(`${BASE_URL}/create_criterion`, {
    method: "POST",
    body: JSON.stringify({
      reviewID,
      criterionRowID,
      grade,
      comments,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return response;
};

export const getReview = async (
  assignmentID: number,
  reviewerID: number,
  revieweeID: number
) => {
  const resp = await fetch(
    `${BASE_URL}/review?assignmentID=${assignmentID}&reviewerID=${reviewerID}&revieweeID=${revieweeID}`,
    {
      credentials: "include",
    }
  );

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return resp;
};

export const getNextGroupID = async (assignmentID: number) => {
  const response = await fetch(
    `${BASE_URL}/next_groupid?assignmentID=${assignmentID}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
};

export const createGroup = async (
  assignmentID: number,
  name: string,
  id: number
) => {
  const response = await fetch(`${BASE_URL}/create_group`, {
    method: "POST",
    body: JSON.stringify({
      assignmentID,
      name,
      id,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
};

export const createTeacherAccount = async (
  name: string,
  email: string,
  password: string
) => {
  const response = await fetch(`${BASE_URL}/admin/users/create`, {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      role: "teacher",
      must_change_password: true,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const response = await fetch(`${BASE_URL}/user/password`, {
    method: "PATCH",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const getDashboard = async () => {
  const resp = await fetch("http://localhost:5000/dashboard/", {
    method: "GET",
    credentials: "include",
  });

  if (!resp.ok) {
    throw new Error(`Dashboard fetch failed: ${resp.status}`);
  }

  return await resp.json();
};

export const editAssignment = async (
  assignmentId: number,
  updates: {
    name?: string;
    due_date?: string | null;
    rubric?: string | null;
    file?: File | null;
  }
) => {
  const formData = new FormData();

  if (updates.name !== undefined) formData.append("name", updates.name);
  if (updates.due_date) formData.append("due_date", updates.due_date);
  if (updates.rubric) formData.append("rubric", updates.rubric);
  if (updates.file) formData.append("file", updates.file);

  const response = await fetch(
    `${BASE_URL}/assignment/edit_assignment/${assignmentId}`,
    {
      method: "PATCH",
      body: formData,
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || `Response status: ${response.status}`);
  }

  return await response.json();
};

export const deleteAssignment = async (assignmentId: number) => {
  const response = await fetch(
    `${BASE_URL}/assignment/delete_assignment/${assignmentId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
};

export const downloadAssignmentFile = async (
  assignmentId: number
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/assignment/download_assignment_file/${assignmentId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to download assignment file");
  }

  const filename = getFilenameFromResponse(
    response,
    `assignment-${assignmentId}`
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

export const submitAssignmentFile = async (
  assignmentId: number,
  file: File
): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/assignment/submit/${assignmentId}`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || "Submission upload failed");
  }
};

export const downloadMySubmissionFile = async (
  assignmentId: number
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/assignment/download_my_submission/${assignmentId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to download submission");
  }

  const filename = getFilenameFromResponse(
    response,
    `submission-${assignmentId}`
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

// NEW: teacher list all submissions for an assignment
export const listAssignmentSubmissions = async (assignmentId: number) => {
  const response = await fetch(
    `${BASE_URL}/assignment/submissions/${assignmentId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to load submissions");
  }

  return await response.json();
};

// NEW: teacher download a specific student's submission
export const downloadStudentSubmissionFile = async (
  assignmentId: number,
  studentId: number
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/assignment/download_submission/${assignmentId}/${studentId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to download student submission");
  }

  const filename = getFilenameFromResponse(
    response,
    `student-${studentId}-submission`
  );

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.URL.revokeObjectURL(url);
};

export const updateMyProfile = async (
  name: string,
  profilePicture?: File | null
) => {
  const formData = new FormData();
  formData.append("name", name);

  if (profilePicture) {
    formData.append("profile_picture", profilePicture);
  }

  const response = await fetch(`${BASE_URL}/user/profile`, {
    method: "PATCH",
    body: formData,
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.msg || "Failed to update profile");
  }

  return await response.json();
};

export const getMyProfile = async () => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    method: "GET",
    credentials: "include",
  });

  maybeHandleExpire(response);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.msg || "Failed to load profile");
  }

  return data;
};