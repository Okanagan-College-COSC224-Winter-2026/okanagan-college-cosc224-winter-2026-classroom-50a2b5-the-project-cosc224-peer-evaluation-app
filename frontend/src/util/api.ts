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
      debugger;
      console.error('Registration failed:', response);
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.msg || `Response status: ${response.status}`);
  }

  return data;
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

export const getAssignment = async (assignmentId: number) => {
  const resp = await fetch(`${BASE_URL}/assignment/detail/${assignmentId}`, {
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

export const listStuGroup = async (courseId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/course/${courseId}/my-group`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
   },
    credentials: 'include',
  })

  maybeHandleExpire(resp);

  // Return null if not in a group (404)
  if (resp.status === 404) {
    return null;
  }

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
} 

export const listGroups = async (courseId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/course/${courseId}`, {
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

export const listUnassignedStudents = async (courseId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/course/${courseId}/unassigned`, {
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

export const listCourseMembers = async (classId: string) => {
  const resp = await fetch(`${BASE_URL}/class/members`, {
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




export const listGroupMembers = async (groupId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/${groupId}/members`, {
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

export const addGroupMember = async (groupId: number, userId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/members/add`, {
    method: 'POST',
    body: JSON.stringify({
      groupID: groupId,
      userID: userId
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

export const removeGroupMember = async (groupId: number, userId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/members/remove`, {
    method: 'POST',
    body: JSON.stringify({
      groupID: groupId,
      userID: userId
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

export const getCriteria = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/rubric/${rubricID}/criteria`, {
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}

export const createCriteria = async (rubricID: number, question: string, scoreMax: number, _canComment: boolean, hasScore: boolean = true) => {
  const response = await fetch(`${BASE_URL}/rubric/${rubricID}/criteria`, {
    method: 'POST',
    body: JSON.stringify({
      question, scoreMax, hasScore
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

export const createRubric = async (assignmentID: number, canComment: boolean): Promise<{ id: number }> => {
  const response = await fetch(`${BASE_URL}/rubric/create`, {
    method: 'POST',
    body: JSON.stringify({
      assignmentID, canComment
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

  const data = await response.json();
  return { id: data.rubric.id };
}

export const getRubric = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/rubric/${rubricID}`, {
      credentials: 'include'
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
      throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
}

export const getRubricForAssignment = async (assignmentID: number) => {
  const resp = await fetch(`${BASE_URL}/rubric/assignment/${assignmentID}`, {
    credentials: 'include'
  });

  maybeHandleExpire(resp);

  // 404 means no rubric exists yet — return null instead of throwing
  if (resp.status === 404) {
    return null;
  }

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
}

export const deleteRubric = async (rubricID: number) => {
  const resp = await fetch(`${BASE_URL}/rubric/${rubricID}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json();
}


export const createAssignment = async (
  courseID: number,
  name: string,
  description?: string,
  start_date?: string,
  due_date?: string,
  is_anonymous: boolean = true,
)=> {
  const response = await fetch(`${BASE_URL}/assignment/create_assignment`, {
    method: 'POST',
    body: JSON.stringify({
      courseID,
      name,
      description,
      start_date,
      due_date,
      is_anonymous,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  })
  
  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }

  return await response.json();
}

export const editAssignment = async (
  assignmentID: number,
  payload: {
    name?: string;
    description?: string;
    start_date?: string;
    due_date?: string;
    rubric?: string;
    is_anonymous?: boolean;
  }
) => {
  const response = await fetch(`${BASE_URL}/assignment/edit_assignment/${assignmentID}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }

  return await response.json();
}

export const deleteAssignment = async (assignmentID: number) => {
  const response = await fetch(`${BASE_URL}/assignment/delete_assignment/${assignmentID}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }

  return await response.json();
}

export const deleteGroup = async (groupId: number) => {
  const resp = await fetch(`${BASE_URL}/groups/${groupId}`, {
    method: 'DELETE',
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

export const getMySubmission = async (assignmentID: number) => {
  const resp = await fetch(`${BASE_URL}/submission/${assignmentID}/mine`, {
    method: 'GET',
    credentials: 'include',
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  const data = await resp.json();
  if (data?.submission?.download_url?.startsWith('/')) {
    data.submission.download_url = `${BASE_URL}${data.submission.download_url}`;
  }
  return data.submission;
}

export const uploadMySubmission = async (assignmentID: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(`${BASE_URL}/submission/${assignmentID}/mine`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  const data = await resp.json();
  if (data?.submission?.download_url?.startsWith('/')) {
    data.submission.download_url = `${BASE_URL}${data.submission.download_url}`;
  }
  return data;
}

export const deleteMySubmission = async (assignmentID: number) => {
  const resp = await fetch(`${BASE_URL}/submission/${assignmentID}/mine`, {
    method: 'DELETE',
    credentials: 'include',
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  return await resp.json();
}

export const listAssignmentResources = async (assignmentID: number) => {
  const resp = await fetch(`${BASE_URL}/assignment-resource/assignment/${assignmentID}`, {
    method: 'GET',
    credentials: 'include',
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  const data = await resp.json();
  const resources = data?.resources || [];
  return resources.map((resource: {
    id: number;
    assignmentID: number;
    uploaderID: number;
    original_name: string;
    download_url?: string;
    created_at?: string;
  }) => ({
    ...resource,
    download_url: resource.download_url?.startsWith('/')
      ? `${BASE_URL}${resource.download_url}`
      : resource.download_url,
  }));
}

export const uploadAssignmentResource = async (assignmentID: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const resp = await fetch(`${BASE_URL}/assignment-resource/assignment/${assignmentID}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  const data = await resp.json();
  const resource = data?.resource;
  if (resource?.download_url?.startsWith('/')) {
    resource.download_url = `${BASE_URL}${resource.download_url}`;
  }
  return data;
}

export const deleteAssignmentResource = async (resourceID: number) => {
  const resp = await fetch(`${BASE_URL}/assignment-resource/${resourceID}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  return await resp.json();
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

  // Don't throw on 404 — review endpoint may not be implemented yet
  return resp
}

export const createGroup = async (courseId: number, name: string) => {
  const response = await fetch(`${BASE_URL}/groups/create`, {
    method: "POST",
    body: JSON.stringify({
      courseID: courseId,
      name
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
  const response = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PUT',
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
