import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
    const Review = models.Review;
    const Criterion = models.Criterion;

    app.get('/review', async (req, resp) => {
        const { assignmentID, reviewerID, revieweeID } = req.query as { assignmentID: string, reviewerID: string, revieweeID: string };

        if (!assignmentID || !reviewerID || !revieweeID) {
            resp.status(400).send({ error: 'Missing required parameters' });
            return;
        }

        const review = await Review.findOne({
            where: {
                assignmentID: parseInt(assignmentID),
                reviewerID: parseInt(reviewerID),
                revieweeID: parseInt(revieweeID),
            }
        });

        if (!review) {
            resp.status(404).send({ error: 'Review not found' });
            return;
        }

        const criterion = await Criterion.findAll({
            where: {
                reviewID: review.id
            }
        })

        const grades: number[] = [];
        criterion.map((c) => {
            if (c.dataValues.grade != undefined) {
                grades.push(c.dataValues.grade)
            }
        })

        resp.send({
            grades
        });
    });
} 