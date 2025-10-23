import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface Criteria_DescriptionAttributes {
  id: number;
  rubricID?: number;
  question?: string;
  scoreMax?: number;
  hasScore?: boolean;
}

export type Criteria_DescriptionPk = "id";
export type Criteria_DescriptionId = Criteria_Description[Criteria_DescriptionPk];
export type Criteria_DescriptionOptionalAttributes = "id" | "rubricID" | "question" | "scoreMax" | "hasScore";
export type Criteria_DescriptionCreationAttributes = Optional<Criteria_DescriptionAttributes, Criteria_DescriptionOptionalAttributes>;

export class Criteria_Description extends Model<Criteria_DescriptionAttributes, Criteria_DescriptionCreationAttributes> implements Criteria_DescriptionAttributes {
  id!: number;
  rubricID?: number;
  question?: string;
  scoreMax?: number;
  hasScore?: boolean;


  static initModel(sequelize: Sequelize.Sequelize): typeof Criteria_Description {
    return sequelize.define('Criteria_Description', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    rubricID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    question: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    scoreMax: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    hasScore: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }, {
    tableName: 'Criteria_Description',
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
  }) as typeof Criteria_Description;
  }
}
