import mysql from 'mysql2';
import { Sequelize } from 'sequelize';
import { initModels } from '../sequelize/init-models';

const client = new Sequelize({
  username: process.env.MYSQL_USER as string,
  password: process.env.MYSQL_PASS as string,
  database: process.env.MYSQL_DB as string,
  host: process.env.MYSQL_HOST as string,
  port: parseInt(process.env.MYSQL_PORT as string),
  dialect: 'mysql',
  dialectModule: mysql,
  // TODO disable on prod
  logging: false,
})

const models = initModels(client);

export default models;