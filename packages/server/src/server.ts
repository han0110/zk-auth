import { readFileSync } from 'fs'
import Koa from 'koa'
import KoaRouter from 'koa-router'
import koaBodyParser from 'koa-bodyparser'
import { MerkleTree, MemStorage, PoseidonHasher } from '@zk-auth/merkle-tree'
import { log, serdeBigInt } from './util'

const createServer = (): Koa => {
  const app = new Koa()
  const router = new KoaRouter()

  const verificationKey = JSON.parse(
    readFileSync(
      process.env.VERIFICATION_KEY_PATH ||
        `${__dirname}/../../../key/membership_auth_2_20_vkey.json`,
      'utf-8',
    ),
  )
  const merkleTree = new MerkleTree(
    new MemStorage(),
    new PoseidonHasher(),
    2,
    20,
  )

  // retrieve member set digest (merkle tree root)
  router.get('/identity/digest', async (ctx) => {
    const merkleTreeRoot = await merkleTree.root()
    log(`identity digest retrieved`)
    ctx.body = { merkleTreeRoot }
  })

  // register identity
  router.post('/identity', serdeBigInt({ req: true }), async (ctx) => {
    const { identityCommitment } = ctx.request.body
    log(`identity 0x${identityCommitment.toString(16)} inserted`)
    await merkleTree.insert(identityCommitment)
  })

  // retrieve identity information (merkle proof)
  router.get(
    '/identity/:identityCommitment',
    serdeBigInt({ req: true }),
    async (ctx) => {
      const identityCommitment = ctx.params
        .identityCommitment as unknown as bigint
      log(`identity 0x${identityCommitment.toString(16)} retrieved`)
      const merkleProof = await merkleTree.merkleProof(identityCommitment)
      ctx.body = { merkleProof }
    },
  )

  // delete identity
  router.delete(
    '/identity/:identityCommitment',
    serdeBigInt({ req: true }),
    async (ctx) => {
      await merkleTree.delete(
        ctx.params.identityCommitment as unknown as bigint,
      )
    },
  )

  // retrieve verification key
  router.get('/key/verification', async (ctx) => {
    ctx.body = verificationKey
  })

  app.use(koaBodyParser())
  app.use(serdeBigInt())
  app.use(router.routes()).use(router.allowedMethods())

  return app
}

export default createServer()
