"""Shared extension instances.

SocketIO is initialized here so that controllers can import and emit events
without circular imports.
"""

from flask_socketio import SocketIO

socketio = SocketIO()
