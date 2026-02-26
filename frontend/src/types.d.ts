interface Course {
  id: number;
  teacherID: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface StudentGroups {
  groupID: number;
  userID: number;
  assignmentID: number;
}

interface CourseGroup{
  id: number;
  name: string;
  assignmentID: number;
}

interface GroupTable {
  [key: number]: GroupTableValue[];
}

interface GroupTableValue{
  groupID: number;
  userID: number;
  assignmentID: number;
}

interface Criterion {
  rubricID: number;
  question: string;
  scoreMax: number;
  hasScore: boolean;
}

interface Assignment {
  id: number;
  name: string;
  courseID: number;
  rubric?: string;
  due_date?: string;
}

interface CourseWithAssignments extends Course {
  assignments?: Assignment[];
  assignmentCount?: number;
<<<<<<< Updated upstream
}
=======
}

// ============================================================
// STUDENT GRADES (US20)
// ============================================================

interface CourseGrade {
  course_id: number;
  course_name: string;
  grade: number | null;
  max_score: number | null;
  graded_assignments: number;
  total_assignments: number;
  has_grades: boolean;
}

interface StudentGradesResponse {
  student_id: number;
  courses: CourseGrade[];
}

interface CriteriaFeedback {
  question: string;
  avg_score: number;
  max_score: number;
  comments: string[];
}

interface FeedbackResponse {
  assignment_name: string;
  total_reviews: number;
  criteria_feedback: CriteriaFeedback[];
  overall_avg: number;
}
>>>>>>> Stashed changes
