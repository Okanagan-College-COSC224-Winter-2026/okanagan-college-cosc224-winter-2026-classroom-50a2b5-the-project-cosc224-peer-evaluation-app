import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface RubricAttributes {
  id: number;
  assignmentID?: number;
  canComment?: boolean;
}

export type RubricPk = "id";
export type RubricId = Rubric[RubricPk];
export type RubricOptionalAttributes = "id" | "assignmentID" | "canComment";
export type RubricCreationAttributes = Optional<RubricAttributes, RubricOptionalAttributes>;

export class Rubric extends Model<RubricAttributes, RubricCreationAttributes> implements RubricAttributes {
  id!: number;
  assignmentID?: number;
  canComment?: boolean;


  static initModel(sequelize: Sequelize.Sequelize): typeof Rubric {
    return sequelize.define('Rubric', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    assignmentID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    canComment: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    tableName: 'Rubric',
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
  }) as typeof Rubric;
  }
}
