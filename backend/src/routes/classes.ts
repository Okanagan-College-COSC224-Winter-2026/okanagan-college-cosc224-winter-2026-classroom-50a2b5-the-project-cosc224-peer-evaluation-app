import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const Course = models.Course;

  app.get('/classes', async (req, resp) => {
    // Check if there is a class already
    const existing = await Course.findAll({
      // TODO where student is in class
    })

    resp.send(existing);
  });
}