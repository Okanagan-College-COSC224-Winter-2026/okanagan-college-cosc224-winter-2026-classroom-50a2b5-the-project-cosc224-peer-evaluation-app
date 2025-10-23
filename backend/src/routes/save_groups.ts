import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  app.post('/save_groups', async (req, resp) => {
    const { groupID, userID, assignmentID } = req.body as {
        groupID: number,
        userID: number,
        assignmentID: number
      };
    
    const GroupMembers = models.Group_Member; 
    
    try {
    GroupMembers.update(
        {groupID},
        {
            where:
            {
                userID,
                assignmentID
            }
        }
    )
    resp.send({
      message: 'successful DB post!'
    });
    } 
    catch (error) {
        resp.send(401);
        console.log(error);    
    }
  });
}