import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const Rubric = models.Rubric;

  app.post('/create_rubric', async (req, resp) => {
    const { id, assignmentID, canComment} = req.body as {
        id: number,
        assignmentID: number,
        canComment: boolean
    };

    Rubric.destroy({
      where: {
        id,
      }
    })

    const newRubric = await Rubric.create({
      id,
      assignmentID,
      canComment
    });

    resp.send({
      message: 'Rubric created',
      id: newRubric.id,
    });
  });
}