import server from './server'
import { log } from './util'

const main = async () => {
  const port = process.env.PORT || 3000

  server.listen(port, () => {
    log(`server listening on port ${port}`)
  })
}

main().catch(console.error)
