import SequelizeAuto from 'sequelize-auto';

const auto = new SequelizeAuto('cosc471', 'root', 'root', {
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  directory: 'src/sequelize',
  singularize: true,
  useDefine: true,
  lang: 'ts'
})

auto.run().then(() => {
  console.log('Done!')
})