import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, resolve } from 'path'
import { compiler } from 'circom'
import { utils } from 'ffjavascript'

type Config = {
  buildDir: string
  verbose?: boolean
  sanityCheck?: boolean
  reduceConstraints?: boolean
  circuits: Array<{
    file: string
    main: string
    params: Array<number>
  }>
}

const template = ({ file, main, params }: Config['circuits'][0]) => `\
include "${resolve(file)}";

component main = ${main}(${params.join(', ')});
`

const compile = async (
  names: string[],
  {
    buildDir,
    verbose = false,
    sanityCheck = true,
    reduceConstraints = true,
  }: Pick<Config, 'buildDir' | 'verbose' | 'sanityCheck' | 'reduceConstraints'>,
): Promise<void> => {
  try {
    await Promise.all(
      names.map((name) =>
        compiler(`${buildDir}/${name}.circom`, {
          verbose,
          sanityCheck,
          reduceConstraints,
          wasmFileName: `${buildDir}/${name}.wasm`,
          r1csFileName: `${buildDir}/${name}.r1cs`,
        }),
      ),
    )
  } catch (err) {
    if (err.pos) {
      console.error(
        `ERROR at ${err.errFile}:${err.pos.first_line},${err.pos.first_column}-${err.pos.last_line},${err.pos.last_column}   ${err.errStr}`,
      )
    } else {
      console.log(err.message)
      console.log(err.stack)
    }
    if (err.ast) {
      console.error(JSON.stringify(utils.stringifyBigInts(err.ast), null, 1))
    }
    throw err
  }
}

const main = async () => {
  const config: Config = JSON.parse(readFileSync('./build.json', 'utf-8'))
  config.buildDir = resolve(`${__dirname}/../${config.buildDir}`)

  mkdirSync(config.buildDir, { recursive: true })
  const names = config.circuits.map((circuit) => {
    const nameSuffix = circuit.params.join('_')
    const name = `${basename(circuit.file, '.circom')}_${nameSuffix}`
    const file = `${config.buildDir}/${name}.circom`
    writeFileSync(file, template(circuit))
    return name
  })

  await compile(names, config)
}

main().catch(() => process.exit(1))
