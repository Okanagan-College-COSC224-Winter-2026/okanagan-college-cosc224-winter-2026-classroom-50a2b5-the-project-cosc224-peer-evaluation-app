
import functools

from flask import (
    Blueprint, flash, g, redirect, render_template, request, session, url_for,
    jsonify
)
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import User, UserSchema



member = Blueprint('member', __name__, url_prefix='/apiv1')


@member.route('/member', methods=('GET', 'POST'))
@jwt_required
def get_member():
    if request.method == 'POST':
        username = get_jwt_identity()
        member = User.get_member(username)
        if not member:
            return jsonify({"msg": "Bad Token"}), 400

        return jsonify(UserSchema().dump(member))

