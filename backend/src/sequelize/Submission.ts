import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface SubmissionAttributes {
  id: number;
  path?: string;
  studentID?: number;
  assignmentID?: number;
}

export type SubmissionPk = "id";
export type SubmissionId = Submission[SubmissionPk];
export type SubmissionOptionalAttributes = "id" | "path" | "studentID" | "assignmentID";
export type SubmissionCreationAttributes = Optional<SubmissionAttributes, SubmissionOptionalAttributes>;

export class Submission extends Model<SubmissionAttributes, SubmissionCreationAttributes> implements SubmissionAttributes {
  id!: number;
  path?: string;
  studentID?: number;
  assignmentID?: number;


  static initModel(sequelize: Sequelize.Sequelize): typeof Submission {
    return sequelize.define('Submission', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    studentID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    assignmentID: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Submission',
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
  }) as typeof Submission;
  }
}
