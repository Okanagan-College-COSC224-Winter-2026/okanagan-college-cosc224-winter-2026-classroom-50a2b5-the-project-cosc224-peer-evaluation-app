from api.extensions import db


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    courseGroupID = db.Column(db.Integer, db.ForeignKey("course_groups.id"), nullable=False)
    classID = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)

    assignment_name = db.Column(db.String(255), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)

    course_group = db.relationship("CourseGroup", back_populates="assignments")
    course_class = db.relationship("Class", back_populates="assignments")
    reviews = db.relationship("Review", back_populates="assignment", cascade="all, delete-orphan")

    # NEW: conclusion file relationship
    conclusion_files = db.relationship(
        "ConclusionFile",
        back_populates="assignment",
        cascade="all, delete-orphan",
        lazy="select",
    )

    @classmethod
    def get_all_assignments(cls):
        return cls.query.all()

    @classmethod
    def get_assignment_by_id(cls, assignment_id):
        return cls.query.get(assignment_id)

    @classmethod
    def add_assignment(cls, course_group_id, class_id, assignment_name, start_date, end_date):
        assignment = cls(
            courseGroupID=course_group_id,
            classID=class_id,
            assignment_name=assignment_name,
            start_date=start_date,
            end_date=end_date,
        )
        db.session.add(assignment)
        db.session.commit()
        return assignment

    @classmethod
    def update_assignment(cls, assignment_id, assignment_name=None, start_date=None, end_date=None):
        assignment = cls.get_assignment_by_id(assignment_id)
        if not assignment:
            return None

        if assignment_name is not None:
            assignment.assignment_name = assignment_name
        if start_date is not None:
            assignment.start_date = start_date
        if end_date is not None:
            assignment.end_date = end_date

        db.session.commit()
        return assignment

    @classmethod
    def delete_assignment(cls, assignment_id):
        assignment = cls.get_assignment_by_id(assignment_id)
        if not assignment:
            return False

        db.session.delete(assignment)
        db.session.commit()
        return True