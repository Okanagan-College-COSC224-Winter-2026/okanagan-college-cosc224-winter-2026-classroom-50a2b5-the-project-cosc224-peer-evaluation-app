"""
Review file controller for the peer evaluation app.
Handles file attachments on peer review submissions (Feature B).

Endpoints:
    POST /review/<id>/upload       — Upload a file attached to a review (student/reviewer only)
    GET  /review/<id>/files        — List all files attached to a review (any authenticated user)
    GET  /review/file/<file_id>    — Download a specific review file (any authenticated user)
"""

import os

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..models import Review, User
from ..models.review_file_model import ReviewFile

review_file_bp = Blueprint("review_file", __name__, url_prefix="/review")

# ── File validation constants ─────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

# Accepted extensions and their expected MIME types
ALLOWED_MIMETYPES = {
    "pdf":  "application/pdf",
    "png":  "image/png",
    "jpg":  "image/jpeg",
    "jpeg": "image/jpeg",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


# ── Private helpers ───────────────────────────────────────────────────────────

def _get_upload_dir() -> str:
    """
    Return the absolute path to the reviews upload subdirectory.
    Uses a separate subdirectory from Feature A (uploads/reviews/) to avoid
    storage conflicts with assignment attachments (uploads/assignments/).
    Creates the directory if it does not already exist.
    """
    upload_dir = os.path.join(current_app.instance_path, "uploads", "reviews")
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def _get_extension(filename: str) -> str:
    """Extract and return the lowercase file extension without the dot."""
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def _is_allowed_file(file) -> bool:
    """
    Validate that the uploaded file is an accepted type.
    Checks both the filename extension and the client-reported MIME type.
    Server-side only — never trust the client alone.
    """
    filename = file.filename or ""
    ext = _get_extension(filename)
    if ext not in ALLOWED_MIMETYPES:
        return False
    return file.mimetype == ALLOWED_MIMETYPES[ext]


def _file_size_bytes(file) -> int:
    """
    Measure file size in bytes without consuming the stream.
    Seeks to end, reads position, then resets to start before saving.
    """
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size


def _format_size(size_bytes: int) -> str:
    """Return a human-readable file size string e.g. '1.8MB'."""
    return f"{size_bytes / (1024 * 1024):.1f}MB"


# ============================================================
# POST /review/<id>/upload
# Upload a file attachment to a review (reviewer only)
# ============================================================

@review_file_bp.route("/<int:review_id>/upload", methods=["POST"])
@jwt_required()
def upload_review_file(review_id):
    """
    Upload a file and attach it to an existing peer review.

    Only the reviewer who submitted the review can attach files to it.
    Expects multipart/form-data with a 'file' field.
    Accepted types: PDF, PNG, JPG, JPEG, DOCX — max 10MB each.

    Returns:
        201 { "message": str, "file_id": int, "filename": str, "size": str }
        400 — missing file, unsupported type, or file too large
        403 — caller is not the reviewer of this review
        404 — review not found
    """
    # ── Resolve review ────────────────────────────────────────────────────────
    review = Review.get_by_id(review_id)
    if review is None:
        return jsonify({"msg": "Review not found"}), 404

    # ── Confirm caller is the reviewer ────────────────────────────────────────
    email = get_jwt_identity()
    uploader = User.get_by_email(email)
    if uploader is None:
        return jsonify({"msg": "User not found"}), 404

    if review.reviewerID != uploader.id:
        return jsonify({"msg": "Unauthorized: You can only attach files to your own reviews"}), 403

    # ── Validate file presence ────────────────────────────────────────────────
    if "file" not in request.files:
        return jsonify({"msg": "No file provided. Include a 'file' field in your multipart/form-data request"}), 400

    uploaded_file = request.files["file"]

    if not uploaded_file.filename:
        return jsonify({"msg": "No file selected"}), 400

    # ── Validate file type ────────────────────────────────────────────────────
    if not _is_allowed_file(uploaded_file):
        allowed = ", ".join(ext.upper() for ext in ALLOWED_MIMETYPES)
        return jsonify({"msg": f"Invalid file type. Accepted types: {allowed}"}), 400

    # ── Enforce 10MB size limit ───────────────────────────────────────────────
    file_size = _file_size_bytes(uploaded_file)
    if file_size > MAX_FILE_SIZE_BYTES:
        return jsonify({"msg": f"File too large ({_format_size(file_size)}). Maximum allowed size is 10MB"}), 400

    # ── Build a safe filename scoped to this review ───────────────────────────
    # Format: review_<review_id>_<original_filename>
    # Keeps filenames readable and avoids collisions between reviews.
    original_filename = uploaded_file.filename
    safe_filename = f"review_{review_id}_{original_filename}"
    upload_dir = _get_upload_dir()
    save_path = os.path.join(upload_dir, safe_filename)

    # ── Save file to disk ─────────────────────────────────────────────────────
    uploaded_file.save(save_path)

    # ── Persist ReviewFile record ─────────────────────────────────────────────
    review_file = ReviewFile(
        reviewID=review_id,
        uploaderID=uploader.id,
        filename=original_filename,
        path=save_path,
    )
    ReviewFile.create_review_file(review_file)

    return jsonify({
        "message": "File uploaded successfully",
        "file_id": review_file.id,
        "filename": original_filename,
        "size": _format_size(file_size),
    }), 201


# ============================================================
# GET /review/<id>/files
# List all files attached to a review (any authenticated user)
# ============================================================

@review_file_bp.route("/<int:review_id>/files", methods=["GET"])
@jwt_required()
def list_review_files(review_id):
    """
    Return metadata for all files attached to a given review.

    Returns:
        200 { "review_id": int, "files": [ { file metadata } ] }
        404 — review not found
    """
    review = Review.get_by_id(review_id)
    if review is None:
        return jsonify({"msg": "Review not found"}), 404

    files = ReviewFile.get_files_by_review(review_id)

    return jsonify({
        "review_id": review_id,
        "files": [
            {
                "file_id": f.id,
                "filename": f.filename,
                "uploaded_at": (
                    f.uploaded_at.isoformat() + "Z" if f.uploaded_at else None
                ),
                "size": (
                    _format_size(os.path.getsize(f.path))
                    if os.path.isfile(f.path)
                    else "unknown"
                ),
            }
            for f in files
        ],
    }), 200


# ============================================================
# GET /review/file/<file_id>
# Download a specific review file by its ID (any authenticated user)
# ============================================================

@review_file_bp.route("/file/<int:file_id>", methods=["GET"])
@jwt_required()
def download_review_file(file_id):
    """
    Download a specific file attached to a review.

    Returns the file as a download response using the original filename.

    Returns:
        200 — file download response
        404 — file record not found, or file missing from disk
    """
    review_file = ReviewFile.get_by_id(file_id)
    if review_file is None:
        return jsonify({"msg": "File not found"}), 404

    if not os.path.isfile(review_file.path):
        return jsonify({"msg": "File not found on server"}), 404

    upload_dir = _get_upload_dir()
    safe_filename = f"review_{review_file.reviewID}_{review_file.filename}"

    return send_from_directory(
        upload_dir,
        safe_filename,
        as_attachment=True,
        download_name=review_file.filename,
    )
