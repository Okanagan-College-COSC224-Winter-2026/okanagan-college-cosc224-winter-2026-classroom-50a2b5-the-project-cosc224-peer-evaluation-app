"""SocketIO event handlers for real-time notifications."""

import logging

from flask_socketio import join_room
from .extensions import socketio

logger = logging.getLogger(__name__)


@socketio.on("connect")
def handle_connect():
    """Client connected."""
    logger.info("SocketIO client connected")


@socketio.on("join")
def handle_join(data):
    """Client joins their personal notification room.

    Expects: { "user_id": int }
    """
    user_id = data.get("user_id")
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
        logger.info(f"User {user_id} joined room {room}")
