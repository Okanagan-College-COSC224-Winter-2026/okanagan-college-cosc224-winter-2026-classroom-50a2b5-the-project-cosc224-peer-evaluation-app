import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface ReviewAttributes {
  id: number;
  assignmentID?: number;
  reviewerID?: number;
  revieweeID?: number;
}

export type ReviewPk = "id";
export type ReviewId = Review[ReviewPk];
export type ReviewOptionalAttributes = "id" | "assignmentID" | "reviewerID" | "revieweeID";
export type ReviewCreationAttributes = Optional<ReviewAttributes, ReviewOptionalAttributes>;

export class Review extends Model<ReviewAttributes, ReviewCreationAttributes> implements ReviewAttributes {
  id!: number;
  assignmentID?: number;
  reviewerID?: number;
  revieweeID?: number;


  static initModel(sequelize: Sequelize.Sequelize): typeof Review {
    return sequelize.define('Review', {
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
    reviewerID: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    revieweeID: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'Review',
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
  }) as typeof Review;
  }
}
