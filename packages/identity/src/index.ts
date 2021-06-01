import * as crypto from 'crypto'
import { babyJub, eddsa, pedersenHash } from 'circomlib'
import { leBuf2Int, leInt2Buf } from './util'

export type EdDSAKeyPair = {
  pubKey: bigint[]
  privKey: Buffer
}

export type EdDSASignature = {
  r8: bigint[]
  s: bigint
}

export type Identity = {
  keypair: EdDSAKeyPair
  nullifier: bigint
  trapdoor: bigint
}

const genRandomBuffer = (numBytes = 32): Buffer => {
  return crypto.randomBytes(numBytes)
}

const genPubKey = (privKey: Buffer): bigint[] => {
  return eddsa.prv2pub(privKey)
}

export const genEddsaKeyPair = (
  privKey: Buffer = genRandomBuffer(),
): EdDSAKeyPair => {
  const pubKey = genPubKey(privKey)
  return { pubKey, privKey }
}

export const genIdentity = (
  privKey: Buffer = genRandomBuffer(32),
): Identity => {
  return {
    keypair: genEddsaKeyPair(privKey),
    nullifier: leBuf2Int(genRandomBuffer(31)),
    trapdoor: leBuf2Int(genRandomBuffer(31)),
  }
}

export const genIdentityCommitment = (identity: Identity): bigint => {
  const buf = Buffer.concat(
    [
      babyJub.mulPointEscalar(identity.keypair.pubKey, 8)[0],
      identity.nullifier,
      identity.trapdoor,
    ].map((x) => leInt2Buf(x, 32)),
  )
  return babyJub.unpackPoint(pedersenHash.hash(buf))[0]
}

export const signMsg = (
  privKey: Buffer,
  msg: bigint | Buffer,
): EdDSASignature => {
  if (typeof msg != 'bigint') {
    msg = leBuf2Int(msg)
  }
  const { R8, S } = eddsa.signMiMCSponge(privKey, msg)
  return { r8: R8, s: S }
}

export const serializeIdentity = (identity: Identity): string => {
  const data = [
    identity.keypair.privKey.toString('hex'),
    identity.nullifier.toString(16),
    identity.trapdoor.toString(16),
  ]
  return JSON.stringify(data)
}

export const deserializeIdentity = (identity: string): Identity => {
  const data = JSON.parse(identity)
  return {
    keypair: genEddsaKeyPair(Buffer.from(data[0], 'hex')),
    nullifier: BigInt('0x' + data[1]),
    trapdoor: BigInt('0x' + data[2]),
  }
}
