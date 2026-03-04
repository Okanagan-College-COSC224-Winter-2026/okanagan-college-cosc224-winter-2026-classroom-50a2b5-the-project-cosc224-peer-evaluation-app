import os
from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename

from api.extensions import db
from api.models import Assignment, AssignmentSchema
from api.models.conclusion_file_model import ConclusionFile
from api.models.schemas import ConclusionFileSchema
from api.models.user_model import User

assignment_bp = Blueprint("assignment_bp", __name__)

assignment_schema = AssignmentSchema()
assignments_schema = AssignmentSchema(many=True)

# ---------------------------------------------------------------------
# Existing endpoints (kept as-is from your backend)
# ---------------------------------------------------------------------


@assignment_bp.get("/assignment")
@jwt_required()
def get_assignments():
    assignments = Assignment.get_all_assignments()
    return jsonify(assignments_schema.dump(assignments)), 200


@assignment_bp.get("/assignment/<int:assignment_id>")
@jwt_required()
def get_assignment(assignment_id):
    assignment = Assignment.get_assignment_by_id(assignment_id)
    if not assignment:
        return jsonify({"message": "Assignment not found"}), 404
    return jsonify(assignment_schema.dump(assignment)), 200


@assignment_bp.post("/assignment")
@jwt_required()
def create_assignment():
    data = request.get_json() or {}

    required_fields = ["courseGroupID", "classID", "assignment_name", "start_date", "end_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"message": f"Missing required field: {field}"}), 400

    try:
        start_date = datetime.fromisoformat(data["start_date"])
        end_date = datetime.fromisoformat(data["end_date"])
    except ValueError:
        return jsonify({"message": "Invalid date format. Use ISO format."}), 400

    assignment = Assignment.add_assignment(
        course_group_id=data["courseGroupID"],
        class_id=data["classID"],
        assignment_name=data["assignment_name"],
        start_date=start_date,
        end_date=end_date,
    )
    return jsonify(assignment_schema.dump(assignment)), 201


@assignment_bp.put("/assignment/<int:assignment_id>")
@jwt_required()
def update_assignment(assignment_id):
    data = request.get_json() or {}

    assignment_name = data.get("assignment_name")
    start_date = data.get("start_date")
    end_date = data.get("end_date")

    if start_date is not None:
        try:
            start_date = datetime.fromisoformat(start_date)
        except ValueError:
            return jsonify({"message": "Invalid start_date format. Use ISO format."}), 400

    if end_date is not None:
        try:
            end_date = datetime.fromisoformat(end_date)
        except ValueError:
            return jsonify({"message": "Invalid end_date format. Use ISO format."}), 400

    assignment = Assignment.update_assignment(
        assignment_id=assignment_id,
        assignment_name=assignment_name,
        start_date=start_date,
        end_date=end_date,
    )

    if not assignment:
        return jsonify({"message": "Assignment not found"}), 404

    return jsonify(assignment_schema.dump(assignment)), 200


@assignment_bp.delete("/assignment/<int:assignment_id>")
@jwt_required()
def delete_assignment(assignment_id):
    success = Assignment.delete_assignment(assignment_id)
    if not success:
        return jsonify({"message": "Assignment not found"}), 404
    return jsonify({"message": "Assignment deleted"}), 200


# ---------------------------------------------------------------------
# Feature B (Dev 2): Conclusion upload + list endpoints
# ---------------------------------------------------------------------

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "docx"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


def _allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def _ensure_conclusion_upload_dir() -> str:
    """
    Store conclusion files under instance/uploads/conclusions
    """
    base_dir = os.path.join(os.getcwd(), "instance", "uploads", "conclusions")
    os.makedirs(base_dir, exist_ok=True)
    return base_dir


def _file_size_ok(file_storage) -> bool:
    """
    Check file size without consuming the stream permanently.
    """
    pos = file_storage.stream.tell()
    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(pos)
    return size <= MAX_FILE_SIZE_BYTES


def _current_user():
    identity = get_jwt_identity()
    if not identity:
        return None
    return User.query.get(identity)


@assignment_bp.post("/assignment/<int:assignment_id>/conclusion/upload")
@jwt_required()
def upload_conclusion_file(assignment_id):
    """
    Teacher uploads a conclusion file to an assignment.
    """
    user = _current_user()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    if user.role.lower() != "teacher":
        return jsonify({"message": "Forbidden: teacher only"}), 403

    assignment = Assignment.get_assignment_by_id(assignment_id)
    if not assignment:
        return jsonify({"message": "Assignment not found"}), 404

    if "file" not in request.files:
        return jsonify({"message": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"message": "No file selected"}), 400

    if not _allowed_file(file.filename):
        return jsonify({"message": "Invalid file type"}), 400

    if not _file_size_ok(file):
        return jsonify({"message": "File too large (max 10MB)"}), 400

    upload_dir = _ensure_conclusion_upload_dir()

    original_name = secure_filename(file.filename)
    stored_name = f"conclusion_{assignment_id}_{original_name}"
    full_path = os.path.join(upload_dir, stored_name)

    file.save(full_path)

    created = ConclusionFile.create_conclusion_file(
        assignment_id=assignment_id,
        teacher_id=user.id,
        filename=original_name,
        path=full_path,
    )

    return (
        jsonify(
            {
                "message": "File uploaded successfully",
                "file_id": created.id,
                "filename": created.filename,
            }
        ),
        201,
    )


@assignment_bp.get("/assignment/<int:assignment_id>/conclusion/files")
@jwt_required()
def list_conclusion_files(assignment_id):
    """
    List conclusion files for an assignment (any authenticated user).
    """
    assignment = Assignment.get_assignment_by_id(assignment_id)
    if not assignment:
        return jsonify({"message": "Assignment not found"}), 404

    files = ConclusionFile.get_files_by_assignment(assignment_id)
    schema = ConclusionFileSchema(many=True)

    return jsonify({"assignment_id": assignment_id, "files": schema.dump(files)}), 200