import { FastifyInstance } from 'fastify';
import models from '../util/database';


export default async function (app: FastifyInstance) {
    const GroupMembers = models.Group_Member;
    app.get<{ Params: { assignmentID: number } }>('/list_ua_groups/:assignmentID', async (req, resp) => {
        const aID = req.params.assignmentID;
        const members = await GroupMembers.findAll({
            where: {
                groupID: -1,
                assignmentID: aID
            }
        });
        resp.send(members);
    });
}
