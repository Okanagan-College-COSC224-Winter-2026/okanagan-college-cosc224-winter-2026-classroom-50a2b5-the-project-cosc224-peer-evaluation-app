import { app } from './app'

app.listen({
  port: 8081,
  host: '0.0.0.0'
}, () => {
  console.log('Server is listening on port 8081!')
})