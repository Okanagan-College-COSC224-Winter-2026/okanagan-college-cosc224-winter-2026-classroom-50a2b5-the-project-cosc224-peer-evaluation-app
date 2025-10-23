import { FastifyInstance } from 'fastify';

export default function (app: FastifyInstance) {
  app.get('/ping', async (req, resp) => {
    resp.send({
      message: 'pong!'
    });
  });
}