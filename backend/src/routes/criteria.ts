import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
    const Criteria = models.Criteria_Description;

    app.get('/criteria', async (req, resp) => {
      const { rubricID } = req.query as { rubricID: string };
      
      if (!rubricID) {
        resp.status(400).send({ error: 'rubricID is required' });
        return;
      }

      const existing = await Criteria.findAll({
        where: {
          rubricID: parseInt(rubricID),
        }
      })
  
      resp.send(existing);
    });
}