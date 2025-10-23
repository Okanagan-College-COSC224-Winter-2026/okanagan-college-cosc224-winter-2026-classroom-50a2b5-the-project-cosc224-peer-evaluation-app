import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default async function (app: FastifyInstance) {
    const GroupMembers = models.Group_Member;
    app.get<{ Params: { assignmentID: number , studentID: number} }>('/list_stu_groups/:assignmentID/:studentID', async (req, resp) => {
        const aID = req.params.assignmentID;
        const sID = req.params.studentID;
        const group = await GroupMembers.findOne({
            where: {
                userID: sID,
                assignmentID: aID
            }
        });
        if(!group?.groupID){
            resp.code(300);
            resp.send({
                msg: 'student has no group'
            })
        }

        const members = await GroupMembers.findAll({
            where: {
                assignmentID: aID,
                groupID: group?.groupID
            }
        });
        resp.send(members);
    });
}