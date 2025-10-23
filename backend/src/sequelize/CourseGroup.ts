import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface CourseGroupAttributes {
  id: number;
  name?: string;
  assignmentID: number;
}

export type CourseGroupPk = "id";
export type CourseGroupId = CourseGroup[CourseGroupPk];
export type CourseGroupOptionalAttributes = "id" | "name";
export type CourseGroupCreationAttributes = Optional<CourseGroupAttributes, CourseGroupOptionalAttributes>;

export class CourseGroup extends Model<CourseGroupAttributes, CourseGroupCreationAttributes> implements CourseGroupAttributes {
  id!: number;
  name?: string;
  assignmentID!: number;


  static initModel(sequelize: Sequelize.Sequelize): typeof CourseGroup {
    return sequelize.define('CourseGroup', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    assignmentID: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'CourseGroup',
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
  }) as typeof CourseGroup;
  }
}
