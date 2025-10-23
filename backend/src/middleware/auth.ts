import { FastifyInstance, HookHandlerDoneFunction } from 'fastify';

interface Options {
  noAuthRoutes: string[];
}

// Fastify middleware that disallows requests unless login succeeds
export default (fastify: FastifyInstance, options: Options, done: HookHandlerDoneFunction) => {
  fastify.addHook('preHandler', (req, reply, done) => {
    if (options?.noAuthRoutes.includes(req.url) || req.method === 'OPTIONS' || process.env.DANGEROUS_DISABLE_ALL_AUTH === 'true') {
      return done();
    }
  
    // Check for the session token in the request
    if (req.headers.authorization) {
      const bearer = req.headers.authorization.split(' ')[1];
      // Check if the token is in the global session state
      // @ts-expect-error this is fine
      if (bearer in fastify.session) {
        // @ts-expect-error this is fine
        const { inactivityExpire, fullExpire } = fastify.session[bearer];
  
        // If we are past fullExpire, remove the token
        if (fullExpire < Date.now()) {
          // @ts-expect-error this is fine
          delete fastify.session[bearer];
          reply.status(401).send({ message: 'Session expired' });
          return done();
        }
        
        // Check if the token has expired
        if (inactivityExpire > Date.now()) {
          // If the token is valid, continue and refresh the inactivityExpire
          // @ts-expect-error this is fine
          fastify.session[bearer].inactivityExpire = Date.now() + 20 * 60 * 1000;
          return done();
        }
  
        // If it has expired, remove it from the session state
        // @ts-expect-error this is fine
        delete fastify.session[bearer];
        reply.status(401).send({ message: 'Session expired' });
        return done();
      }
    }
  
    reply.status(401).send();
    done();
  });
  done()
}
