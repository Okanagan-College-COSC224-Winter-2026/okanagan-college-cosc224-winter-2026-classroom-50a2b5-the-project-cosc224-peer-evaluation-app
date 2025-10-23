import { FastifyInstance } from 'fastify';
import models from '../util/database';

export default function (app: FastifyInstance){
    const assignments = models.Assignment;
    
    app.get<{Params: {course : string}}>('/assignments/:course', async (req, resp) =>{
        const course = req.params.course + '';
        const current = await assignments.findAll({
            where: {
                courseID: course
            }
        });

        resp.send(current);
    });
}