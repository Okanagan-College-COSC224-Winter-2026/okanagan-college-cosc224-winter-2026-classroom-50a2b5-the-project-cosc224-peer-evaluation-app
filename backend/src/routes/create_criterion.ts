import { FastifyInstance } from 'fastify';
import models from '../util/database';

//API endpoint to create a criterion(single row in a review)

export default function (app: FastifyInstance) {
  const Criterion = models.Criterion;

  app.post('/create_criterion', async (req, resp) => {
    const { reviewID, criterionRowID, grade, comments } = req.body as {
      reviewID: number
      criterionRowID: number
      grade: number
      comments: string
    };

    const newCriterion = await Criterion.create({
      reviewID,
      criterionRowID,
      grade,
      comments,
    });

    resp.send({
      message: 'Criterion created',
      id: newCriterion.id,
    });
  });
}