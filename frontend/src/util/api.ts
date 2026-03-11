import { didExpire, removeToken } from "./login";

const BASE_URL = 'http://localhost:5000'

export const maybeHandleExpire = (response: Response) => {
  if (didExpire(response)) {
    removeToken();
    window.location.href = '/';
  }
}

export const tryLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    const json = await response.json();
    localStorage.setItem('user', JSON.stringify(json));
    return json;
  } catch (error) {
    console.error(error);
  }
  return false
}

export const tryRegister = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

export const createClass = async (name: string) => {
  const response = await fetch(`${BASE_URL}/class/create_class`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  return response
}

export const listClasses = async () => {
  const resp = await fetch(`${BASE_URL}/class/classes`, {
    method: 'GET',
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const importStudentsForCourse = async (courseID: number, students: string) => {
  const response = await fetch(`${BASE_URL}/class/enroll_students`, {
    method: 'POST',
    body: JSON.stringify({ students, class_id: courseID }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
}

export const listAssignments = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/assignment/` + classId, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const listStuGroup = async (assignmentId: number, studentId: number) => {
  const resp = await fetch(`${BASE_URL}/list_stu_groups/` + assignmentId + "/" + studentId, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const listGroups = async (assignmentId: number) => {
  const resp = await fetch(`${BASE_URL}/list_all_groups/` + assignmentId, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const listUnassignedGroups = async (assignmentId: number) => {
  const resp = await fetch(`${BASE_URL}/list_ua_groups/` + assignmentId, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  return await resp.json()
}

export const listCourseMembers = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/class/classes/members`, {
    method: 'POST',
    body: JSON.stringify({ id: classId }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const listGroupMembers = async (assignmentId: number, groupID: number) => {
  const resp = await fetch(`${BASE_URL}/list_group_members/` + assignmentId + '/' + groupID, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const getUserId = async () => {
  const resp = await fetch(`${BASE_URL}/user_id`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const saveGroups = async (groupID: number, userID: number, assignmentID: number) => {
  await fetch(`${BASE_URL}/save_groups`, {
    method: 'POST',
    body: JSON.stringify({ groupID, userID, assignmentID }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
}

export const getCriteria = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/assignment/criteria?rubricID=${rubricID}`, {
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const createCriteria = async (rubricID: number, question: string, scoreMax: number, _canComment: boolean, hasScore: boolean = true) => {
  const response = await fetch(`${BASE_URL}/assignment/rubric/${rubricID}/criteria`, {
    method: 'POST',
    body: JSON.stringify({ question, scoreMax, hasScore }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
}

export const createRubric = async (_id: number, assignmentID: number, canComment: boolean): Promise<{ id: number }> => {
  const response = await fetch(`${BASE_URL}/assignment/${assignmentID}/rubric`, {
    method: 'POST',
    body: JSON.stringify({ canComment }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  return await response.json();
}

export const getRubric = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/assignment/rubric/by-id?rubricID=${rubricID}`, {
    credentials: 'include'
  });
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json();
}

export const createAssignment = async (courseID: number, name: string, description_html: string = "") => {
  const response = await fetch(`${BASE_URL}/assignment/create_assignment`, {
    method: 'POST',
    body: JSON.stringify({ courseID, name, description_html }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  return await response.json();
}

export const deleteGroup = async (groupID: number) => {
  await fetch(`${BASE_URL}/delete_group`, {
    method: 'POST',
    body: JSON.stringify({ groupID }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
}

export const getReview = async (assignmentID: number, reviewerID: number, revieweeID: number) => {
  const resp = await fetch(`${BASE_URL}/assignment/review?assignmentID=${assignmentID}&reviewerID=${reviewerID}&revieweeID=${revieweeID}`, {
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return resp
}

export const getNextGroupID = async (assignmentID: number) => {
  const response = await fetch(`${BASE_URL}/next_groupid?assignmentID=${assignmentID}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  return await response.json();
}

export const createGroup = async (assignmentID: number, name: string, id: number) => {
  const response = await fetch(`${BASE_URL}/create_group`, {
    method: "POST",
    body: JSON.stringify({ assignmentID, name, id }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) throw new Error(`Response status: ${response.status}`);
  return await response.json();
}

export const createTeacherAccount = async (name: string, email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/admin/users/create`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role: 'teacher', must_change_password: true }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }
  return await response.json();
}

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await fetch(`${BASE_URL}/user/password`, {
    method: 'PATCH',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }
  return await response.json();
}

export const getAssignment = async (assignmentId: number): Promise<Assignment> => {
  const resp = await fetch(`${BASE_URL}/assignment/detail/${assignmentId}`, {
    method: 'GET',
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getRubricByAssignment = async (assignmentId: number): Promise<any> => {
  const resp = await fetch(`${BASE_URL}/assignment/${assignmentId}/rubric`, {
    method: 'GET',
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const submitReview = async (data: ReviewSubmission): Promise<{ review_id: number }> => {
  const response = await fetch(`${BASE_URL}/api/reviews/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
  maybeHandleExpire(response);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }
  return await response.json()
}

export const getStudentGrades = async (): Promise<StudentGradesResponse> => {
  const resp = await fetch(`${BASE_URL}/student/grades`, {
    method: 'GET',
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

export const getStudentFeedback = async (assignmentId: number): Promise<FeedbackResponse> => {
  const resp = await fetch(`${BASE_URL}/student/assignments/${assignmentId}/feedback`, {
    method: 'GET',
    credentials: 'include'
  })
  maybeHandleExpire(resp);
  if (!resp.ok) throw new Error(`Response status: ${resp.status}`);
  return await resp.json()
}

// ============================================================
// ASSIGNMENT FILE ATTACHMENTS (Feature A) — Dev 5
// ============================================================

export const uploadAssignmentFile = async (
  assignmentId: number,
  file: File
): Promise<{ message: string; filename: string; size: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/assignment/${assignmentId}/upload`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.msg || errorData.message || `Upload failed: ${response.status}`
    );
  }

  return await response.json();
};

export const getAssignmentAttachmentUrl = (assignmentId: number): string => {
  return `${BASE_URL}/assignment/${assignmentId}/attachment`;
};

export const downloadAssignmentAttachment = async (
  assignmentId: number,
  filename: string = "attachment.pdf"
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/assignment/${assignmentId}/attachment`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const deleteAssignmentAttachment = async (
  assignmentId: number
): Promise<{ message: string }> => {
  const response = await fetch(
    `${BASE_URL}/assignment/${assignmentId}/attachment`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.msg || errorData.message || `Delete failed: ${response.status}`
    );
  }

  return await response.json();
};

// ============================================================
// UPDATE ASSIGNMENT (from dev)
// ============================================================

export const updateAssignment = async (assignmentId: number, name: string, description_html: string) => {
  const response = await fetch(`${BASE_URL}/assignment/edit_assignment/${assignmentId}`, {
    method: "PATCH",
    body: JSON.stringify({ name, description_html }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })
  maybeHandleExpire(response)
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  return await response.json()
}

// Admin - Create Teacher Account
export const createTeacherAccount = async (name: string, email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/admin/users/create`, {
    method: 'POST',
    body: JSON.stringify({ 
      name, 
      email, 
      password,
      role: 'teacher',
      must_change_password: true
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });
// Feature B - Review File Upload

export const uploadReviewFiles = async (reviewID: number, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${BASE_URL}/review/${reviewID}/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return await response.json();
};

export const getReviewFiles = async (reviewID: number) => {
  const resp = await fetch(`${BASE_URL}/review/${reviewID}/files`, {
    method: "GET",
    credentials: "include",
  });
  maybeHandleExpire(resp);
  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }
  return await resp.json();
};

export const downloadReviewFile = (fileId: number): string => {
  return `${BASE_URL}/review/file/${fileId}`;
};

// ============================================================
// CONCLUSION FILES (Feature B) — Dev 5
// ============================================================

export const uploadConclusionFile = async (
  assignmentId: number,
  file: File
): Promise<{ message: string; file_id: number; filename: string; size: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${BASE_URL}/assignment/${assignmentId}/conclusion/upload`,
    {
      method: "POST",
      body: formData,
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.msg || errorData.message || `Upload failed: ${response.status}`
    );
  }

  return await response.json();
};

export const listConclusionFiles = async (
  assignmentId: number
): Promise<{
  assignment_id: number;
  files: Array<{
    file_id: number;
    filename: string;
    uploaded_at: string | null;
    teacher: string | null;
  }>;
}> => {
  const resp = await fetch(
    `${BASE_URL}/assignment/${assignmentId}/conclusion/files`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Failed to list conclusion files: ${resp.status}`);
  }

  return await resp.json();
};

export const downloadConclusionFile = async (
  fileId: number,
  filename: string = "conclusion.pdf"
): Promise<void> => {
  const response = await fetch(
    `${BASE_URL}/review/file/${fileId}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
