import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const Assignment = models.Assignment;

  app.post('/create_assignment', async (req, resp) => {
    const { courseID, name } = req.body as {
        courseID: number,
        name: string
    };


    const newAssignment = await Assignment.create({
        courseID,
        name
    });

    resp.send({
      message: 'Ass-ignment created',
      id: newAssignment.id,
    });
  });
}