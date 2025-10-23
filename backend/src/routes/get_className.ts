import { FastifyInstance } from 'fastify';
import models from '../util/database';


export default async function (app: FastifyInstance) {
    const CourseModel = models.Course;
    app.get<{ Params: { classID: number } }>('/get_className/:classID', async (req, resp) => {
        const cID = req.params.classID;
        
        const classData = await CourseModel.findOne({
            where: { id: cID },
        });

        if (!classData) {
            return resp.status(404).send({ error: 'Class not found' });
        }

        resp.send({ className: classData.name });
    });
}
