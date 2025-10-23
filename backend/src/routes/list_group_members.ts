import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default async function (app: FastifyInstance) {
    const GroupMembers = models.Group_Member;
    //const CourseGroup = models.CourseGroup;
    app.get<{ Params: { assignmentID: number, groupID: string } }>('/list_group_members/:assignmentID/:groupID', async (req, resp) => {
        const aID = req.params.assignmentID;
        const gID = req.params.groupID;
        const members = await GroupMembers.findAll({
            where: {
                groupID: gID,
                assignmentID: aID
            }
        });
        resp.send(members);
    });
}