export type Witness = {
  challenge: bigint
  identityPk: bigint[]
  identityNullifier: bigint
  identityTrapdoor: bigint
  identityBranchIndex: bigint[]
  identitySiblings: bigint[][]
  authSigR: bigint[]
  authSigS: bigint
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
