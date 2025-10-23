import Fastify from 'fastify'
import fp from 'fastify-plugin'
import fs from 'fs'
import path from 'path';
import cors from '@fastify/cors';
import authentication from './middleware/auth';

export const app = Fastify({
  // Documents may be upwrads of 100mb
  bodyLimit: 100 * 1024 * 1024,
})

app.register(cors);
app.register(fp(authentication), { noAuthRoutes: ['/login', '/ping'] })
app.decorate('session', {})

;(async () => {
  // Read routes, run the default export as a function, passing the app
  const files = fs.readdirSync(path.join(__dirname, 'routes'));
  for (const file of files) {
    const name = file.replace('.ts', '');
    const route = await import(`./routes/${name}`);

    //console.log('Registering route', name);

    route.default(app);
  }
})()