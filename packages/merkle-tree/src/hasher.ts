import { poseidon } from 'circomlib'

export interface Hasher {
  hash: (inputs: bigint[]) => bigint
}

export class PoseidonHasher implements Hasher {
  hash(inputs: bigint[]): bigint {
    return poseidon(inputs)
  }
}
