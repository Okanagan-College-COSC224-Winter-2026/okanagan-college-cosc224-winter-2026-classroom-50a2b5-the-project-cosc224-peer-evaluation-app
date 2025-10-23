import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface Group_MemberAttributes {
  groupID: number;
  userID: number;
  assignmentID: number;
}

export type Group_MemberPk = "groupID" | "userID";
export type Group_MemberId = Group_Member[Group_MemberPk];
export type Group_MemberCreationAttributes = Group_MemberAttributes;

export class Group_Member extends Model<Group_MemberAttributes, Group_MemberCreationAttributes> implements Group_MemberAttributes {
  groupID!: number;
  userID!: number;
  assignmentID!: number;

  static initModel(sequelize: Sequelize.Sequelize): typeof Group_Member {
    return sequelize.define('Group_Member', {
    groupID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    assignmentID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: false
    }
  }, {
    tableName: 'Group_Members',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "userID" },
          { name: "groupID" },
        ]
      },
    ]
  }) as typeof Group_Member;
  }
}
