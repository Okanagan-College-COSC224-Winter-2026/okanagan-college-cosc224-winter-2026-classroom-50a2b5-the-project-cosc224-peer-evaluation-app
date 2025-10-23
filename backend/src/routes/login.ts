import { FastifyInstance } from 'fastify';
import { sha512, sha512_256 } from 'js-sha512';
import models from '../util/database';

const User = models.User;

export default function (app: FastifyInstance) {
  app.get('/login', async (req, resp) => {
    // This should contain basic auth header
    const auth = req.headers.authorization;
    if (!auth) {
      resp.status(400).send('Bad request');
      return;
    }

    // Get user/pass
    const [user, pass] = Buffer.from(auth.slice('basic '.length), 'base64').toString().split(':');
    const hashedPass = sha512(pass);

    // Check if user/pass is correct
    const userData = await User.findOne({
      where: {
        name: user,
        hash_pass: hashedPass,
      }
    })

    // Something went wrong
    if (!userData) {
      resp.status(401).send('Unauthorized');
      return;
    }

    const token = generateToken(user);

    // Store a session token in the global state
    // @ts-expect-error this is fine
    app.session = {
      [token]: {
        // TODO make this configurable
        // Expire in 20 minutes
        inactivityExpire: Date.now() + 20 * 60 * 1000,
        // No matter what, expire after 3 days
        fullExpire: Date.now() + 3 * 24 * 60 * 60 * 1000,
        username: user,
        id: userData.id,
      },
      // @ts-expect-error this is fine
      ...app.session
    }

    resp.status(200).send({
      token,
      isTeacher: userData.is_teacher,
    });
  });
}

const generateToken = (username: string) => {
  const seed = process.cpuUsage().system;
  return sha512_256(username + seed);
}
