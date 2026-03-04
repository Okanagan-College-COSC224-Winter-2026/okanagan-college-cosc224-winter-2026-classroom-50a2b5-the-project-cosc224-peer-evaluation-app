import { didExpire, removeToken } from "./login";

const BASE_URL = 'http://localhost:5000'

// export const getProfile = async (id: string) => {
//   // TODO
// }


export const maybeHandleExpire = (response: Response) => {
  if (didExpire(response)) {
    // Remove the token
    removeToken();

    window.location.href = '/';
  }
}

export const tryLogin = async (email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, password: password }),
      credentials: 'include'  // Include cookies in request/response
    });
    
    if (!response.ok) { 
      // Throw if login fails for any reason
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    
    // Store user info (but not token - that's in httponly cookie now)
    localStorage.setItem('user', JSON.stringify(json));
    //console.log("Logged in:", json);

    return json;
  } catch (error) {
    // Login is wrong
    console.error(error);
    // window.location.href = '/';
  }

  return false
}

export const tryRegister = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password
      }),
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(error);
  }
}

export const createClass = async (name: string) => {
  const response = await fetch(`${BASE_URL}/class/create_class`, {
    method: 'POST',
    body: JSON.stringify({
      name,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'  // Include cookies (JWT token)
  })

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response
}

export const listClasses = async () => {
  // TODO get session info and whatnot
  const resp = await fetch(`${BASE_URL}/class/classes`, {
    method: 'GET',
    credentials: 'include'  // Include cookies (JWT token)
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

export const importStudentsForCourse = async (courseID: number, students: string) => {
  const response = await fetch(`${BASE_URL}/class/enroll_students`, {
    method: 'POST',
    body: JSON.stringify({
      students,
      class_id: courseID,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
}

export const listAssignments = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/assignment/`+classId, {
    method: 'GET',
    headers: {
       'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

export const listStuGroup = async (assignmentId : number, studentId : number) => {
  const resp = await fetch(`${BASE_URL}/list_stu_groups/`+ assignmentId + "/" + studentId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })

  maybeHandleExpire(resp);


  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
} 

export const listGroups = async (assignmentId : number) => {
  const resp = await fetch(`${BASE_URL}/list_all_groups/` + assignmentId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })
  maybeHandleExpire(resp);


  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }
  
  return await resp.json()
} 

export const listUnassignedGroups = async (assignmentId : number) => {
  const resp = await fetch(`${BASE_URL}/list_ua_groups/` + assignmentId, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })

  maybeHandleExpire(resp);

  return await resp.json()
}

export const listCourseMembers = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/classes/members`, {
    method: 'POST',
    body: JSON.stringify({
      id: classId,
    }),
    headers: {
       'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }
  
  return await resp.json()
} 




export const listGroupMembers = async (assignmentId : number, groupID: number) => {
  const resp = await fetch(`${BASE_URL}/list_group_members/` + assignmentId + '/' + groupID, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }
  
  return await resp.json()
} 

export const getUserId = async () => {
  const resp = await fetch(`${BASE_URL}/user_id`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }
  
  return await resp.json()
} 

export const saveGroups = async (groupID: number, userID: number, assignmentID : number) =>{
  await fetch(`${BASE_URL}/save_groups`, {
    method: 'POST',
    body: JSON.stringify({
      groupID,
      userID,
      assignmentID
    }),
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })
}

export const getCriteria = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/criteria?rubricID=${rubricID}`, {
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

export const createCriteria = async (rubricID: number, question: string, scoreMax: number, canComment: boolean, hasScore: boolean = true) => {
  const response = await fetch(`${BASE_URL}/create_criteria`, {
    method: 'POST',
    body: JSON.stringify({
      rubricID, question, scoreMax, canComment, hasScore
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
}

export const createRubric = async (id: number, assignmentID: number, canComment: boolean): Promise<{ id: number }> => {
  const response = await fetch(`${BASE_URL}/create_rubric`, {
    method: 'POST',
    body: JSON.stringify({
      id, assignmentID, canComment
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
}

export const getRubric = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/rubric?rubricID=${rubricID}`, {
      credentials: 'include'
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
      throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
}


export const createAssignment = async (courseID: number, name: string)=> {
  const response = await fetch(`${BASE_URL}/assignment/create_assignment`, {
    method: 'POST',
    body: JSON.stringify({
      courseID, name
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })
  
  maybeHandleExpire(response);

  if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
}

export const deleteGroup = async (groupID: number) => {
  await fetch(`${BASE_URL}/delete_group`, {
    method: 'POST',
    body: JSON.stringify({
      groupID,
    }),
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })
}

export const createReview = async (assignmentID: number, reviewerID: number, revieweeID: number) => {
  const response = await fetch(`${BASE_URL}/create_review`, {
    method: 'POST',
    body: JSON.stringify({
      assignmentID,
      reviewerID,
      revieweeID,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response
}

export const createCriterion = async (reviewID: number, criterionRowID: number, grade: number, comments: string) => {
  const response = await fetch(`${BASE_URL}/create_criterion`, {
    method: 'POST',
    body: JSON.stringify({
      reviewID,
      criterionRowID,
      grade,
      comments,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response
}

export const getReview = async (assignmentID: number, reviewerID: number, revieweeID: number) => {
  const resp = await fetch(`${BASE_URL}/review?assignmentID=${assignmentID}&reviewerID=${reviewerID}&revieweeID=${revieweeID}`, {
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return resp
}

export const getNextGroupID = async(assignmentID: number)=> {
  const response = await fetch(`${BASE_URL}/next_groupid?assignmentID=${assignmentID}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })

  maybeHandleExpire(response);

  if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
}

export const createGroup = async(assignmentID: number, name: string, id: number) =>{
  const response = await fetch(`${BASE_URL}/create_group`,{
    method:"POST",
    body: JSON.stringify({
      assignmentID, name, id
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })
  maybeHandleExpire(response);

  if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
  }

  return await response.json();
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

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
}

// User - Change Password
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await fetch(`${BASE_URL}/user/password`, {
    method: 'PATCH',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || `Response status: ${response.status}`);
  }

  return await response.json();
}
<<<<<<< Updated upstream
=======

export const getAssignment = async (assignmentId: number): Promise<Assignment> => {
  const resp = await fetch(`${BASE_URL}/assignment/detail/${assignmentId}`, {
    method: 'GET',
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

// Peer Review Submission (US1/US11)

export const getRubricByAssignment = async (assignmentId: number): Promise<RubricResponse> => {
  const resp = await fetch(`${BASE_URL}/assignment/${assignmentId}/rubric`, {
    method: 'GET',
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

export const submitReview = async (data: ReviewSubmission): Promise<{ review_id: number }> => {
  const response = await fetch(`${BASE_URL}/api/reviews/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
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

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

// ============================================================
// STUDENT FEEDBACK (US12) — Dev 5
// ============================================================

export const getStudentFeedback = async (assignmentId: number): Promise<FeedbackResponse> => {
  const resp = await fetch(`${BASE_URL}/student/assignments/${assignmentId}/feedback`, {
    method: 'GET',
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

/**
 * Upload a PDF attachment to an assignment.
 * Only teachers can upload. Max 10MB, PDF only.
 *
 * @param assignmentId - The assignment to attach the file to
 * @param file - The PDF File object to upload
 * @returns Upload result with filename and size
 */
export const uploadAssignmentFile = async (
  assignmentId: number,
  file: File
): Promise<{ message: string; filename: string; size: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  // NOTE: Do NOT set Content-Type header — the browser sets it
  // automatically with the correct multipart boundary
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

/**
 * Get the download URL for an assignment's attachment.
 * Returns the URL string that can be used in an <a> tag or window.open().
 *
 * @param assignmentId - The assignment to download from
 * @returns The full download URL
 */
export const getAssignmentAttachmentUrl = (assignmentId: number): string => {
  return `${BASE_URL}/assignment/${assignmentId}/attachment`;
};

/**
 * Download an assignment's attachment (triggers browser download).
 * Uses fetch with credentials to handle auth, then creates a blob URL.
 *
 * @param assignmentId - The assignment to download from
 * @param filename - Suggested filename for the download
 */
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

  // Convert response to blob and trigger download
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

/**
 * Delete an assignment's attachment.
 * Only teachers can delete.
 *
 * @param assignmentId - The assignment to remove the attachment from
 */
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
>>>>>>> Stashed changes
