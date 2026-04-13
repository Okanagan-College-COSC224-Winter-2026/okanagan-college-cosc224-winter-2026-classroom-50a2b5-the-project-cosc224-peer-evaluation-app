"""
Development entry point — runs Flask with SocketIO support (WebSockets).
Use this instead of `flask run` so real-time notifications work.

    python run_dev.py
"""

from api import create_app
from api.extensions import socketio

app = create_app()

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=True,
        log_output=True,
        allow_unsafe_werkzeug=True,
    )
