import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
    const Rubric = models.Rubric;

    app.get('/rubric', async (req, resp) => {
        const { rubricID } = req.query as { rubricID: string };
        
        if (!rubricID) {
            resp.status(400).send({ error: 'rubricID is required' });
            return;
        }

        const rubric = await Rubric.findOne({
            where: {
                id: parseInt(rubricID),
            }
        });

        if (!rubric) {
            resp.status(404).send({ error: 'Rubric not found' });
            return;
        }

        resp.send({
            id: rubric.id,
            assignmentID: rubric.assignmentID,
            canComment: rubric.canComment
        });
    });
} 