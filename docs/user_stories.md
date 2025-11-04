# User Stories

## US1 – Student Peer Review Access
**As a student, I want to be able to access a set number of assignments assigned by my instructor, so that I can provide feedback on my classmates’ work.**

### Assumptions and Details
- User is signed in with valid credentials  
- User is enrolled in a class that uses the peer review system  
- Instructor has created the assignment  
- Instructor has assigned peer reviews to this student  
- Review window is currently open  

### Acceptance Criteria
- [ ] Student can view a list of peer assignments to review  
- [ ] Number of visible assignments matches what was assigned  
- [ ] Student cannot open unassigned submissions  
- [ ] Opening an assigned submission shows the content and review interface  
- [ ] Submitted feedback marks that review as “complete”  
- [ ] If the review period has ended, the student cannot submit feedback and is notified  

---

## US2 – Group Contribution Evaluation
**As a student, I want to evaluate my peers’ contributions in group projects, so that individual efforts are recognized fairly.**

### Assumptions and Details
- User is signed in with valid credentials  
- User is part of a group assignment  
- Instructor has enabled peer evaluation for this project  
- Review period is active  

### Acceptance Criteria
- [ ] Student can see a list of group members  
- [ ] Student can submit ratings/comments for each group member  
- [ ] Feedback is stored and visible to the instructor  
- [ ] Once submitted, the evaluation cannot be edited  
- [ ] If the review period is closed, submission is blocked  

---

## US3 – Anonymous Peer Review Process
**As an instructor, I want the peer review process to be fair and anonymous, so that the system promotes collaboration, accountability, and skill development among students.**

### Assumptions and Details
- Instructor is signed in  
- Instructor has at least one class with enrolled students  
- Peer reviews have been generated/assigned  
- System supports anonymous display of reviewer/reviewee  

### Acceptance Criteria
- [ ] Students cannot see the names of their reviewers  
- [ ] Students cannot see the names of the students they reviewed after submission  
- [ ] Instructor can see who reviewed whom  
- [ ] Instructor can view completion status for all assigned peer reviews  

---

## US4 – Class and Assignment Creation
**As an instructor, I want to be able to create classes and associated assignments with evaluation events, so that I can provide my students with evaluation and review materials.**

### Assumptions and Details
- Instructor is signed in  
- Instructor has permission to create/manage classes  

### Acceptance Criteria
- [ ] Instructor can create a class  
- [ ] Instructor can create an assignment under that class  
- [ ] Students in that class can see the assignment  
- [ ] Instructor can edit or delete the assignment before its start/due date  

---

## US5 – Student Progress Dashboard
**As an instructor, I want a comprehensive view of student progress, so that I can effectively assess both individual and group performances.**

### Assumptions and Details
- Instructor is signed in  
- Students have submitted assignments and/or peer reviews  
- There is at least one active assignment in the class  

### Acceptance Criteria
- [ ] Instructor can see per-student submission status  
- [ ] Instructor can see per-assignment submission status  
- [ ] Instructor can see per-student review completion status  

---

## US6 – System Maintenance and Management
**As an administrator, I want the ability to maintain and manage the system, so that I can ensure it remains stable and updated.**

### Assumptions and Details
- Admin is signed in with admin privileges  
- System is running  

### Acceptance Criteria
- [ ] Admin can view all user accounts  
- [ ] Admin can view system logs  
- [ ] Admin-only options are not visible to non-admin users  
- [ ] Admin has access to project files  

---

## US7 – User Registration
**As a user, I want to create an account using my name, email, and password so that I can securely log in to the peer review platform.**

### Assumptions and Details
- User is on the registration page  
- Email address is not already in use  
- Network connection is available  

### Acceptance Criteria
- [ ] Registration form requires name, email, and password  
- [ ] System validates email format and password strength  
- [ ] On success, the user is created in the system  
- [ ] User can log in afterward with those credentials  

---

## US8 – Cross-Platform Accessibility
**As a user, I want to be able to access the system on both desktop and mobile, so that I can use whatever device I have available to me.**

### Assumptions and Details
- User has valid credentials  
- User has internet access  
- Application has a responsive UI  

### Acceptance Criteria
- [ ] UI renders correctly on common desktop resolutions  
- [ ] UI renders correctly on common mobile resolutions  
- [ ] Core actions work on both  

---

## US9 – Assignment Management Interface
**As an instructor, I want a simple interface for managing assignments and reviews, so that I can use the system easily and save time.**

### Assumptions and Details
- Instructor is signed in  
- Instructor already has at least one class  
- There are assignments to manage  

### Acceptance Criteria
- [ ] Instructor can view all assignments for a class in one place  
- [ ] Instructor can open an assignment and view its peer review settings  
- [ ] Instructor can edit or delete an assignment from the same interface  
- [ ] Actions give clear success/error messages  

---

## US10 – Data Privacy and Security
**As a system administrator, I want to ensure student data is protected by clear privacy guidelines, so that all users’ information remains secure.**

### Assumptions and Details
- Admin is signed in  
- System has role-based access control  
- Organization has a privacy/security policy  

### Acceptance Criteria
- [ ] Sensitive data is only visible to authorized roles  
- [ ] Data in transit is protected  

---

## US11 – Rubric Creation
**As an instructor, I want to be able to create a rubric, so that students have a set of criteria to mark against.**

### Assumptions and Details
- Instructor is signed in  
- Instructor has an assignment to attach the rubric to  
- Rubric builder UI is available  

### Acceptance Criteria
- [ ] Instructor can add multiple rubric criteria  
- [ ] Instructor can set scale/score for each criterion  
- [ ] Instructor can save the rubric and attach it to an assignment  
- [ ] Students see that rubric when performing a peer review  

---

## US12 – Student Feedback Viewing
**As a student, I want to be able to view the feedback I receive from my peers, so that I can understand how to improve my work.**

### Assumptions and Details
- Student is signed in  
- Student has submitted an assignment that was peer reviewed  

### Acceptance Criteria
- [ ] Student can open an assignment and see received feedback  
- [ ] Feedback shows rubric scores and comments  
- [ ] Feedback remains available after viewing  
