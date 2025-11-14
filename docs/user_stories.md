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

---

## US13 – Teacher Change Password
**As a teacher, I want to change my password so that I can update my login information.**

### Assumptions and Details
- The teacher has a current password  
- A way to change the password exists  

### Acceptance Criteria
Given the teacher has a current password  
When the teacher changes their password  
Then the teacher’s password is updated  

---

## US14 – Teacher Dashboard Visibility
**As a teacher, I want to see my dashboard so that I can view my teaching-related items.**

### Assumptions and Details
- A dashboard exists for teachers  

### Acceptance Criteria
Given the teacher has accessed the system  
When the teacher views their dashboard  
Then the teacher sees their dashboard content  

---

## US15 – Course Page Shows Assignments
**As a teacher, I want my dashboard to show my courses and their assignments so that I can see what I have created.**

### Assumptions and Details
- Courses exist  
- Assignments exist for those courses  

### Acceptance Criteria
Given the teacher has created courses and assignments  
When the teacher views their dashboard  
Then the dashboard shows the courses and the assignments within them  

---

## US16 – Student Login After Roster Upload
**As a student, I want to log in after my teacher uploads the roster so that I can access the system.**

### Assumptions and Details
- The student is included on a roster  
- Logging in is possible  

### Acceptance Criteria
Given the student is on the roster  
When the student logs in  
Then the student gains access to the system  

---

## US17 – Student Course Search
**As a student, I want to search for my course so that I can find it easily.**

### Assumptions and Details
- A course exists to be found  

### Acceptance Criteria
Given a course exists  
When the student searches for the course  
Then the course appears in the search results  

---

## US18 – Student Registration (Roster-Matched)
**As a student, I want to register if my email is already part of the course roster so that I can join my course.**

### Assumptions and Details
- The student’s email appears in the roster  
- Registration is possible  

### Acceptance Criteria
Given the student’s email is on the roster  
When the student registers  
Then the student joins the course  

---

## US19 – Student Access Registered Courses
**As a student, I want to view courses I am registered for so that I can access course content.**

### Assumptions and Details
- The student is registered for courses  

### Acceptance Criteria
Given the student is registered for courses  
When the student logs into the system  
Then the student can access those courses  

---

## US20 – Student Course Grade on Course Card
**As a student, I want to see my total grade on each course card so that I know how I am performing.**

### Assumptions and Details
- The student has a total grade for the course  

### Acceptance Criteria
Given the student has a total grade  
When the student views the course card  
Then the total grade is displayed on the card  

---

## US21 – Student Profile Viewing
**As a student, I want to see my profile information so that I can confirm my details.**

### Assumptions and Details
- The student has profile information stored  

### Acceptance Criteria
Given the student has profile information  
When the student views their profile  
Then the student sees their information  

---

## US22 – Student View Team Submissions
**As a student, I want to see the submitted assignments from my team members so that I can review their work.**

### Assumptions and Details
- The student has team members  
- Team members have submitted assignments  

### Acceptance Criteria
Given submitted assignments from team members exist  
When the student views the team submissions  
Then the student sees the submitted assignments  

---

## US23 – Peer Review Team Members
**As a student, I want to peer review my team members privately so that I can evaluate their contributions.**

### Assumptions and Details
- The student has team members  
- Peer reviews are allowed  

### Acceptance Criteria
Given the student has team members  
When the student performs a peer review  
Then the review is submitted privately  

---

## US24 – Developer Documentation
**As a developer, I want instructions on how to start and test the project with mock credentials so that I can work on the system.**

### Assumptions and Details
- Documentation is provided  
- Mock credentials exist  

### Acceptance Criteria
Given a developer needs to start and test the project  
When the developer reads the documentation  
Then the developer can start and test the project using the mock credentials  

