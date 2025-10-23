import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default async function (app: FastifyInstance) {
    const CourseGroup = models.CourseGroup;
    app.get<{ Params: { assignmentID: number } }>('/list_all_groups/:assignmentID', async (req, resp) => {
        const aID = req.params.assignmentID;
        const members = await CourseGroup.findAll({
            where: {
                assignmentID: aID
            }
        });
        resp.send(members);
    });
}