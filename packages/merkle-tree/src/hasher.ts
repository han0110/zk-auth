import { poseidon } from 'circomlib'

export interface Hasher {
  hash: (inputs: BigInt[]) => BigInt
}

export class PoseidonHasher implements Hasher {
  hash(inputs: BigInt[]): BigInt {
    return poseidon(inputs)
  }
}
