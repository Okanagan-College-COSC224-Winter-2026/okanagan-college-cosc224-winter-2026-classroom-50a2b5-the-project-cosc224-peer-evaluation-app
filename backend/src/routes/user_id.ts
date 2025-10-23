import { FastifyInstance } from 'fastify';

export default function (app: FastifyInstance) {
  app.get('/user_id', async (req, resp) => {

    const token = req.headers.authorization?.split('Bearer ')[1];
        // @ts-expect-error this is fine
    const id = app.session[token].id;
    resp.send(id);
    });
}