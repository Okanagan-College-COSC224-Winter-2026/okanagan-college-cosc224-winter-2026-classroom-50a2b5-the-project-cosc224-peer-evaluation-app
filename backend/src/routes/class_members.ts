import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const Users = models.User
  const UserCourses = models.User_Course;

  app.post('/classes/members', async (req, resp) => {
    const { id } = req.body as {
      id: number
    };
    const members = await UserCourses.findAll({
      where: {
        courseID: id
      }
    })
    const users = await Users.findAll({
      where: {
        id: members.map(member => member.userID)
      },
      // Don't leak hash password
      attributes: ['id', 'name', 'email']
    })

    resp.send(users);
  });
}