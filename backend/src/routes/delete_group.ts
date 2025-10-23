import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const group = models.CourseGroup;
  const members = models.Group_Member;

  app.post('/delete_group', async (req, resp) => {
    const { groupID } = req.body as {
        groupID: number
    };

    //update all members of the group to have groupID -1
    const groupMembers = await members.update({
        groupID: -1
    }, {
        where: {
            groupID: groupID
        }
    });

    //delete the group from the CourseGroup table
    await group.destroy({
        where: {
            id: groupID
        }
    });

    resp.send({
      message: 'Group deleted, all members updated',
      id: groupID,
      groupMembers: groupMembers
    });
  });
}