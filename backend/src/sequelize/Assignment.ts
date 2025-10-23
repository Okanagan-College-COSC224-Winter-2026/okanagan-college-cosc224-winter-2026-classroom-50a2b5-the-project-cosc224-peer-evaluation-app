import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface AssignmentAttributes {
  id: number;
  courseID?: number;
  name?: string;
  rubric?: string;
}

export type AssignmentPk = "id";
export type AssignmentId = Assignment[AssignmentPk];
export type AssignmentOptionalAttributes = "id" | "courseID" | "name" | "rubric";
export type AssignmentCreationAttributes = Optional<AssignmentAttributes, AssignmentOptionalAttributes>;

export class Assignment extends Model<AssignmentAttributes, AssignmentCreationAttributes> implements AssignmentAttributes {
  id!: number;
  courseID?: number;
  name?: string;
  rubric?: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof Assignment {
    return sequelize.define('Assignment', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    courseID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rubric: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'Assignment',
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
  }) as typeof Assignment;
  }
}
