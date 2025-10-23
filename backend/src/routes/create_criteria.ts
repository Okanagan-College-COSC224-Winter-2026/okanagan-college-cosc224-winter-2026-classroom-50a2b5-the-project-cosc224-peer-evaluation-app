import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const Criteria_Description = models.Criteria_Description;

  app.post('/create_criteria', async (req, resp) => {
    const { id, rubricID, question, scoreMax, hasScore } = req.body as {
      id: number,
      rubricID: number,
      question: string,
      scoreMax: number,
      hasScore: boolean
    };

    const newCriteria = await Criteria_Description.create({
      id,
      rubricID,
      question, 
      scoreMax,
      hasScore
    });

    resp.send({
      message: 'Criterion created',
      id: newCriteria.id,
    });
  });
}