import { groth16 } from 'snarkjs'

export type GetIdentityDigestRes = {
  merkleTreeRoot: string
}

export type GetIdentityReq = {
  identityCommitment: string
}

export type GetIdentityRes = {
  identityCommitment: string
}

export type PostIdentityReq = {
  identityCommitment: string
}

export type DeleteIdentityReq = {
  identityCommitment: string
}

export type GetVerificationKeyReq = groth16.VerificationKey
