"""
User model for the peer evaluation app.
"""
from .db import db, ma

class User(db.Model):
    """User model with role-based authentication"""
    __tablename__ = 'User'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    hash_pass = db.Column(db.String(128), nullable=False)
    is_teacher = db.Column(db.Boolean, nullable=False, default=False)

    # relationships
    teaching_courses = db.relationship('Course', back_populates='teacher', foreign_keys='Course.teacherID', lazy='dynamic')
    user_courses = db.relationship('User_Course', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')
    courses = db.relationship('Course', secondary='User_Courses', back_populates='students', lazy='dynamic', overlaps='user_courses')
    submissions = db.relationship('Submission', back_populates='student', cascade='all, delete-orphan', lazy='dynamic')
    reviews_made = db.relationship('Review', back_populates='reviewer', foreign_keys='Review.reviewerID', lazy='dynamic')
    reviews_received = db.relationship('Review', back_populates='reviewee', foreign_keys='Review.revieweeID', lazy='dynamic')
    group_memberships = db.relationship('Group_Members', back_populates='user', cascade='all, delete-orphan', lazy='dynamic')

    def __init__(self, name, email, hash_pass, is_teacher=False):
        self.name = name
        self.email = email
        self.hash_pass = hash_pass
        self.is_teacher = is_teacher

    def __repr__(self):
        return f'<User id={self.id} email={self.email}>'

    @classmethod
    def get_by_id(cls, user_id):
        return db.session.get(cls, int(user_id))
    
    @classmethod
    def get_by_email(cls, email):
        """Get user by email"""
        return cls.query.filter_by(email=email).first()
    
    @classmethod
    def create_user(cls, user):
        """Add a new user to the database"""
        db.session.add(user)
        db.session.commit()
        return user

    def update(self):
        """Update user in the database"""
        db.session.commit()

    def delete(self):
        """Delete user from the database"""
        db.session.delete(self)
        db.session.commit()

    def is_teacher_user(self):
        """Check if the user is a teacher"""
        return self.is_teacher
    
    # Keep backward compatibility aliases
    @classmethod
    def get_member_by_email(cls, email):
        """Get member by email"""
        return cls.get_by_email(email)
    
    @classmethod
    def get_member_by_id(cls, user_id):
        """Get member by ID"""
        return cls.get_by_id(user_id)
    
    @classmethod
    def add_member(cls, user):
        """Add a new member to the database"""
        return cls.create_user(user)