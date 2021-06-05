import { createHash, randomBytes } from 'crypto'
import { babyJub, eddsa, pedersenHash } from 'circomlib'
import { buf2BigInt, bigInt2Buf, bigInt2BitRevBuf } from './util'

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
  return randomBytes(numBytes)
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
    nullifier: buf2BigInt(genRandomBuffer(31)),
    trapdoor: buf2BigInt(genRandomBuffer(31)),
  }
}

export const genIdentityCommitment = (identity: Identity): bigint => {
  const buf = Buffer.concat(
    [
      babyJub.mulPointEscalar(identity.keypair.pubKey, 8)[0],
      identity.nullifier,
      identity.trapdoor,
    ].map((x) => bigInt2Buf(x, 32)),
  )
  return babyJub.unpackPoint(pedersenHash.hash(buf))[0]
}

export const signMsg = (
  privKey: Buffer,
  msg: bigint | Buffer,
): EdDSASignature => {
  if (typeof msg != 'bigint') {
    msg = buf2BigInt(msg)
  }
  const { R8, S } = eddsa.signMiMCSponge(privKey, msg)
  return { r8: R8, s: S }
}

export const calculateNullifier = (
  identity: Identity,
  challenge: bigint,
): bigint => {
  const buf = createHash('sha256')
    .update(
      Buffer.concat([
        bigInt2BitRevBuf(identity.nullifier, 31),
        bigInt2BitRevBuf(challenge, 29),
        Buffer.alloc(4),
      ]),
    )
    .digest()
  buf[buf.length - 1] &= 0b11111000
  return buf2BigInt(buf)
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
