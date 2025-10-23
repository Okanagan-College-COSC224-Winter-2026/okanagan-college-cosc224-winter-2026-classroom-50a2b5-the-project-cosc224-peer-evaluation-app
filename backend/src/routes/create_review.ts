import { FastifyInstance } from 'fastify';
import models from '../util/database';

//API endpoint to create a review

export default function (app: FastifyInstance) {
  const Review = models.Review;

  app.post('/create_review', async (req, resp) => {
    const { assignmentID, reviewerID, revieweeID } = req.body as {
      assignmentID: number
      reviewerID: number
      revieweeID: number
    };

    const newReview = await Review.create({
      assignmentID,
      reviewerID,
      revieweeID,
    });

    resp.send({
      message: 'Review created',
      id: newReview.id,
    });
  });
}