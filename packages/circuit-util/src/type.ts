import { EdDSASignature, Identity } from '@zk-auth/identity'
import { MerkleProof } from '@zk-auth/merkle-tree'

export type Witness = {
  challenge: bigint
  identity: Identity
  signature: EdDSASignature
  merkleProof: MerkleProof
}

export type Proof = {
  piA: string
  piB: string
  piC: string
}

export type PublicSignals = {
  root: string
  nullifierHash: string
  challenge: string
}
