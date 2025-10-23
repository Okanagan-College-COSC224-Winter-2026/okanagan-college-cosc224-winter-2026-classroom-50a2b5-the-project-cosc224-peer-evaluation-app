import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  is_teacher: boolean;
  hash_pass: string;
}

export type UserPk = "id";
export type UserId = User[UserPk];
export type UserOptionalAttributes = "id";
export type UserCreationAttributes = Optional<UserAttributes, UserOptionalAttributes>;

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  id!: number;
  name!: string;
  email!: string;
  is_teacher!: boolean;
  hash_pass!: string;

  static initModel(sequelize: Sequelize.Sequelize): typeof User {
    return sequelize.define('User', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "email"
    },
    is_teacher: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hash_pass: {
      type: DataTypes.STRING(128),
      allowNull: false
    }
  }, {
    tableName: 'User',
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
      {
        name: "email",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "email" },
        ]
      },
    ]
  }) as typeof User;
  }
}
