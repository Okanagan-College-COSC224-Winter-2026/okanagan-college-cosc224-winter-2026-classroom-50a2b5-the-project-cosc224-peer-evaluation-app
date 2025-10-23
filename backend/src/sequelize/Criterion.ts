import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface CriterionAttributes {
  id: number;
  reviewID?: number;
  criterionRowID?: number
  grade?: number;
  comments?: string;
}

export type CriterionPk = "id";
export type CriterionId = Criterion[CriterionPk];
export type CriterionOptionalAttributes = "id" | "reviewID" | "criterionRowID" | "grade" | "comments";
export type CriterionCreationAttributes = Optional<CriterionAttributes, CriterionOptionalAttributes>;

export class Criterion extends Model<CriterionAttributes, CriterionCreationAttributes> implements CriterionAttributes {
  id!: number;
  reviewID?: number;
  criterionRowID?: number;
  grade?: number;
  comments?: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof Criterion {
    return sequelize.define('Criterion', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    reviewID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    criterionRowID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    comments: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'Criterion',
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
  }) as typeof Criterion;
  }
}
