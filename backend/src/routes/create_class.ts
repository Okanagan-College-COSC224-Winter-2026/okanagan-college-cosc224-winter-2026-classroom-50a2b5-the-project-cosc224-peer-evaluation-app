import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const Course = models.Course;

  app.post('/create_class', async (req, resp) => {
    const { name } = req.body as {
      name: string
    };

    // Check if there is a class already
    const existing = await Course.findAll({
      where: {
        name,
      }
    })

    // If one exists, return error
    if (existing.length > 0) {
      resp.status(400).send({
        message: 'Class already exists'
      });
      return;
    }

    const newClass = await Course.create({
      name,
      // TODO change to getting session ID
      teacherID: 0,
    });

    resp.status(201).send({
      message: 'Class created',
      id: newClass.id,
    });
  });
}