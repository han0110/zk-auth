import { mkdirSync, createWriteStream, writeFileSync } from 'fs'
import { basename } from 'path'
import { randomBytes } from 'crypto'
import { r1cs, zKey } from 'snarkjs'
import { utils } from 'ffjavascript'
import fetch from 'node-fetch'

const downloadPowerOfTau = async (
  sizeStr: string,
  ptauPath: string,
): Promise<void> => {
  const stream = createWriteStream(ptauPath)
  const response = await fetch(
    `https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${sizeStr}.ptau`,
  )
  response.body.pipe(stream)
  await new Promise<void>((resolve) =>
    stream.on('finish', () => {
      stream.close()
      resolve()
    }),
  )
}

export const setup = async (
  r1csPath: string,
  keyDir: string,
): Promise<void> => {
  mkdirSync(keyDir, { recursive: true })
  const { nConstraints } = await r1cs.info(r1csPath)
  const sizeStr = Math.ceil(Math.log2(nConstraints)).toString().padStart(2, '0')
  const name = basename(r1csPath, '.r1cs')
  const ptauPath = `${keyDir}/power_of_tau_${sizeStr}.ptau`
  const newZkeyPath = `${keyDir}/${name}_new.zkey`
  const finalZkeyPath = `${keyDir}/${name}_final.zkey`
  const verificationKeyPath = `${keyDir}/${name}_vkey.json`

  await downloadPowerOfTau(sizeStr, ptauPath)
  await zKey.newZKey(r1csPath, ptauPath, newZkeyPath)
  await zKey.beacon(
    newZkeyPath,
    finalZkeyPath,
    'final',
    randomBytes(32).toString('hex'),
    10,
  )
  const vKey = await zKey.exportVerificationKey(finalZkeyPath)
  writeFileSync(
    verificationKeyPath,
    JSON.stringify(utils.stringifyBigInts(vKey), null, 2),
  )
}
