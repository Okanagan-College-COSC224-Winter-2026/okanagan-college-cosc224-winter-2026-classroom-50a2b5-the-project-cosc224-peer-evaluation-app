import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance) {
  const group = models.CourseGroup;

  app.post('/create_group', async (req, resp) => {
    const { assignmentID, name, id} = req.body as {
        id: number,
        name: string,
        assignmentID: number
    };
    
    try {
      const newGroup = await group.create({
        id,
        name,
        assignmentID
    });

    resp.send({
      message: 'group created',
      id: newGroup.id,
    });
    
    } catch (error) {
     console.log(error); 
    }



  });
}