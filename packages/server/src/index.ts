import server from './server'

const main = async () => {
  const port = process.env.PORT || 3000

  server.listen(port, () => {
    console.log(`server listening on port ${port}`)
  })
}

main().catch(console.error)
