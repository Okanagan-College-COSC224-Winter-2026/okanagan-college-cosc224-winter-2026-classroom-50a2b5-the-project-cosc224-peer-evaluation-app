import os
from datetime import datetime

from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
    send_file,
)
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from ..models import (
    Course,
    Assignment,
    User,
    AssignmentSchema,
    Submission,
    SubmissionSchema,
    User_Course,
)
from ..models.db import db
from .auth_controller import jwt_teacher_required

bp = Blueprint("assignment", __name__, url_prefix="/assignment")


def ensure_upload_dir(path):
    os.makedirs(path, exist_ok=True)


def allowed_file(filename):
    allowed_extensions = {
        "pdf",
        "doc",
        "docx",
        "txt",
        "png",
        "jpg",
        "jpeg",
        "zip",
        "py",
        "java",
        "c",
        "cpp",
        "ppt",
        "pptx",
        "xls",
        "xlsx",
        "csv",
    }
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed_extensions
    )


def is_student_in_course(student_id, course_id):
    enrollment = User_Course.query.filter_by(
        userID=student_id,
        courseID=course_id,
    ).first()
    return enrollment is not None


@bp.route("/create_assignment", methods=["POST"])
@jwt_teacher_required
def create_assignment():
    data = request.get_json(silent=True) or request.form
    course_id = data.get("courseID")
    assignment_name = data.get("name")
    rubric_text = data.get("rubric")
    due_date = data.get("due_date")
    teacher_file = request.files.get("file")

    if not due_date:
        due_date = None
    else:
        due_date = datetime.fromisoformat(due_date)

    if not course_id:
        return jsonify({"msg": "Course ID is required"}), 400
    if not assignment_name:
        return jsonify({"msg": "Assignment name is required"}), 400

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(course_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "Unauthorized: You are not the teacher of this class"}
        ), 403

    attachment_filename = None
    attachment_path = None

    if teacher_file:
        if teacher_file.filename == "":
            return jsonify({"msg": "No selected file"}), 400

        if not allowed_file(teacher_file.filename):
            return jsonify({"msg": "File type not allowed"}), 400

        safe_name = secure_filename(teacher_file.filename)
        upload_dir = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            "assignments",
            str(course_id),
        )
        ensure_upload_dir(upload_dir)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        stored_name = f"{timestamp}_{safe_name}"
        full_path = os.path.join(upload_dir, stored_name)
        teacher_file.save(full_path)

        attachment_filename = safe_name
        attachment_path = full_path

    new_assignment = Assignment(
        courseID=course_id,
        name=assignment_name,
        rubric_text=rubric_text,
        due_date=due_date,
        attachment_filename=attachment_filename,
        attachment_path=attachment_path,
    )
    Assignment.create(new_assignment)

    return (
        jsonify(
            {
                "msg": "Assignment created",
                "assignment": AssignmentSchema().dump(new_assignment),
            }
        ),
        201,
    )

@bp.route("/edit_assignment/<int:assignment_id>", methods=["PATCH"])
@jwt_teacher_required
def edit_assignment(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if course is None:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "Unauthorized: You are not the teacher of this class"}
        ), 403

    if not assignment.can_modify():
        return jsonify(
            {"msg": "Assignment cannot be edited after its due date"}
        ), 400

    data = request.get_json(silent=True) or request.form
    assignment.name = data.get("name", assignment.name)
    assignment.rubric_text = data.get("rubric", assignment.rubric_text)

    due_date = data.get("due_date")
    if due_date:
        assignment.due_date = datetime.fromisoformat(due_date)

    teacher_file = request.files.get("file")
    if teacher_file:
        if teacher_file.filename == "":
            return jsonify({"msg": "No selected file"}), 400

        if not allowed_file(teacher_file.filename):
            return jsonify({"msg": "File type not allowed"}), 400

        safe_name = secure_filename(teacher_file.filename)
        upload_dir = os.path.join(
            current_app.config["UPLOAD_FOLDER"],
            "assignments",
            str(course.id),
        )
        ensure_upload_dir(upload_dir)

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        stored_name = f"{timestamp}_{safe_name}"
        full_path = os.path.join(upload_dir, stored_name)
        teacher_file.save(full_path)

        if (
            assignment.attachment_path
            and os.path.exists(assignment.attachment_path)
        ):
            os.remove(assignment.attachment_path)

        assignment.attachment_filename = safe_name
        assignment.attachment_path = full_path

    assignment.update()

    return (
        jsonify(
            {
                "msg": "Assignment updated",
                "assignment": AssignmentSchema().dump(assignment),
            }
        ),
        200,
    )


@bp.route("/delete_assignment/<int:assignment_id>", methods=["DELETE"])
@jwt_teacher_required
def delete_assignment(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "Unauthorized: You are not the teacher of this class"}
        ), 403

    if not assignment.can_modify():
        return jsonify(
            {"msg": "Assignment cannot be deleted after its due date"}
        ), 400

    if (
        assignment.attachment_path
        and os.path.exists(assignment.attachment_path)
    ):
        os.remove(assignment.attachment_path)

    submissions = Submission.get_by_assignment_id(assignment.id)
    for submission in submissions:
        if submission.file_path and os.path.exists(submission.file_path):
            os.remove(submission.file_path)
        db.session.delete(submission)

    db.session.commit()
    assignment.delete()

    return jsonify({"msg": "Assignment deleted"}), 200


@bp.route("/<int:class_id>", methods=["GET"])
@jwt_required()
def get_assignments(class_id):
    course = Course.get_by_id(class_id)
    if not course:
        return jsonify({"msg": "Class not found"}), 404

    assignments = Assignment.get_by_class_id(class_id)
    assignments_data = AssignmentSchema(many=True).dump(assignments)
    return jsonify(assignments_data), 200


@bp.route("/download_assignment_file/<int:assignment_id>", methods=["GET"])
@jwt_required()
def download_assignment_file(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    if not assignment.attachment_path:
        return jsonify({"msg": "No file attached to this assignment"}), 404

    if not os.path.exists(assignment.attachment_path):
        return jsonify({"msg": "File not found on server"}), 404

    return send_file(
        assignment.attachment_path,
        as_attachment=True,
        download_name=assignment.attachment_filename,
    )


@bp.route("/submit/<int:assignment_id>", methods=["POST"])
@jwt_required()
def submit_assignment(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if user.id == course.teacherID:
        return jsonify({"msg": "Teachers cannot submit assignments"}), 403

    if not is_student_in_course(user.id, course.id):
        return jsonify({"msg": "You are not enrolled in this class"}), 403

    submission_file = request.files.get("file")
    if not submission_file:
        return jsonify({"msg": "Submission file is required"}), 400

    if submission_file.filename == "":
        return jsonify({"msg": "No selected file"}), 400

    if not allowed_file(submission_file.filename):
        return jsonify({"msg": "File type not allowed"}), 400

    safe_name = secure_filename(submission_file.filename)
    upload_dir = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        "submissions",
        str(assignment.id),
        str(user.id),
    )
    ensure_upload_dir(upload_dir)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    stored_name = f"{timestamp}_{safe_name}"
    full_path = os.path.join(upload_dir, stored_name)
    submission_file.save(full_path)

    existing_submission = Submission.get_by_student_and_assignment(
        user.id,
        assignment.id,
    )

    if existing_submission:
        if (
            existing_submission.file_path
            and os.path.exists(existing_submission.file_path)
        ):
            os.remove(existing_submission.file_path)

        existing_submission.file_name = safe_name
        existing_submission.file_path = full_path
        existing_submission.submitted_at = datetime.utcnow()
        existing_submission.update()

        print("=== UPDATED SUBMISSION ===")
        print("id:", existing_submission.id)
        print("studentID:", existing_submission.studentID)
        print("assignmentID:", existing_submission.assignmentID)
        print("file_name:", existing_submission.file_name)
        print("file_path:", existing_submission.file_path)
        print("submitted_at:", existing_submission.submitted_at)

        return jsonify(
            {
                "msg": "Submission updated",
                "submission": SubmissionSchema().dump(
                    existing_submission
                ),
            }
        ), 200

    new_submission = Submission(
        file_name=safe_name,
        file_path=full_path,
        studentID=user.id,
        assignmentID=assignment.id,
    )
    new_submission.submitted_at = datetime.utcnow()
    Submission.create_submission(new_submission)

    print("=== CREATED SUBMISSION ===")
    print("id:", new_submission.id)
    print("studentID:", new_submission.studentID)
    print("assignmentID:", new_submission.assignmentID)
    print("file_name:", new_submission.file_name)
    print("file_path:", new_submission.file_path)
    print("submitted_at:", new_submission.submitted_at)

    return jsonify(
        {
            "msg": "Submission uploaded",
            "submission": SubmissionSchema().dump(new_submission),
        }
    ), 201


@bp.route("/my_submission/<int:assignment_id>", methods=["GET"])
@jwt_required()
def get_my_submission(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    submission = Submission.get_by_student_and_assignment(
        user.id,
        assignment_id,
    )
    if not submission:
        return jsonify({"msg": "No submission found"}), 404

    return jsonify(SubmissionSchema().dump(submission)), 200


@bp.route("/download_my_submission/<int:assignment_id>", methods=["GET"])
@jwt_required()
def download_my_submission(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    submission = Submission.get_by_student_and_assignment(
        user.id,
        assignment_id,
    )
    if not submission:
        return jsonify({"msg": "No submission found"}), 404

    if not submission.file_path or not os.path.exists(submission.file_path):
        return jsonify({"msg": "Submission file not found"}), 404

    return send_file(
        submission.file_path,
        as_attachment=True,
        download_name=submission.file_name,
    )


@bp.route("/submissions/<int:assignment_id>", methods=["GET"])
@jwt_teacher_required
def list_submissions(assignment_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "Unauthorized: You are not the teacher of this class"}
        ), 403

    submissions = (
        Submission.query.filter_by(assignmentID=assignment_id)
        .order_by(Submission.submitted_at.desc())
        .all()
    )

    print("=== LIST SUBMISSIONS ===")
    print("assignment_id:", assignment_id)
    print("count:", len(submissions))
    for submission in submissions:
        print(
            "submission ->",
            submission.id,
            submission.studentID,
            submission.assignmentID,
            submission.file_name,
            submission.submitted_at,
        )

    return jsonify(SubmissionSchema(many=True).dump(submissions)), 200


@bp.route(
    "/download_submission/<int:assignment_id>/<int:student_id>",
    methods=["GET"],
)
@jwt_teacher_required
def download_student_submission(assignment_id, student_id):
    assignment = Assignment.get_by_id(assignment_id)
    if not assignment:
        return jsonify({"msg": "Assignment not found"}), 404

    email = get_jwt_identity()
    user = User.get_by_email(email)
    if not user:
        return jsonify({"msg": "User not found"}), 404

    course = Course.get_by_id(assignment.courseID)
    if not course:
        return jsonify({"msg": "Course not found"}), 404

    if course.teacherID != user.id:
        return jsonify(
            {"msg": "Unauthorized: You are not the teacher of this class"}
        ), 403

    submission = Submission.get_by_student_and_assignment(
        student_id,
        assignment_id,
    )
    if not submission:
        return jsonify({"msg": "Submission not found"}), 404

    if not submission.file_path or not os.path.exists(submission.file_path):
        return jsonify({"msg": "Submission file not found"}), 404

    return send_file(
        submission.file_path,
        as_attachment=True,
        download_name=submission.file_name,
    )