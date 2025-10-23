import { FastifyInstance } from 'fastify';
import models from '../util/database';
import { Op } from 'sequelize';



export default async function (app: FastifyInstance) {
    const CourseGroups = models.CourseGroup;
    app.get('/next_groupid', async (req, resp) => {
        const groupCount = await CourseGroups.count({
            where:{
                id: {
                    [Op.gt]: 0
                }
            }
        })

        resp.send(groupCount);
    });
}