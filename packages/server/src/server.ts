import Koa from 'koa'
import KoaRouter from 'koa-router'
import koaBodyParser from 'koa-bodyparser'

const createServer = (): Koa => {
  const app = new Koa()
  const router = new KoaRouter()

  // retrieve information (merkle root)
  router.post('/info', (ctx) => {
    // TODO
  })

  // register identity
  router.post('/identity', (ctx) => {
    // TODO
  })

  // retrieve identity information (merkle proof)
  router.get('/identity/:identityCommitment', (ctx) => {
    // TODO
  })

  // retrieve verification key
  router.get('/key/verification', (ctx) => {
    // TODO
  })

  // retrieve proving key
  router.get('/key/phase2', (ctx) => {
    // TODO
  })

  app.use(koaBodyParser())
  app.use(router.routes()).use(router.allowedMethods())

  return app
}

export default createServer()
