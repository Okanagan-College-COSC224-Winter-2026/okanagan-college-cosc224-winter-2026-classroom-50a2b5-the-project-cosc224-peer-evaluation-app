import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface User_CourseAttributes {
  courseID: number;
  userID: number;
}

export type User_CoursePk = "courseID" | "userID";
export type User_CourseId = User_Course[User_CoursePk];
export type User_CourseCreationAttributes = User_CourseAttributes;

export class User_Course extends Model<User_CourseAttributes, User_CourseCreationAttributes> implements User_CourseAttributes {
  courseID!: number;
  userID!: number;


  static initModel(sequelize: Sequelize.Sequelize): typeof User_Course {
    return sequelize.define('User_Course', {
    courseID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'User_Courses',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "userID" },
          { name: "courseID" },
        ]
      },
    ]
  }) as typeof User_Course;
  }
}
