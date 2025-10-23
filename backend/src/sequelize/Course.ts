import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface CourseAttributes {
  id: number;
  teacherID: number;
  name?: string;
}

export type CoursePk = "id";
export type CourseId = Course[CoursePk];
export type CourseOptionalAttributes = "id" | "name";
export type CourseCreationAttributes = Optional<CourseAttributes, CourseOptionalAttributes>;

export class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  id!: number;
  teacherID!: number;
  name?: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof Course {
    return sequelize.define('Course', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    teacherID: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'Course',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  }) as typeof Course;
  }
}
