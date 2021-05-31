declare module 'circomlib' {
  export namespace babyJub {
    function unpackPoint(point: bigint[]): bigint[]
    function mulPointEscalar(point: bigint[], scalar: number): bigint[]
  }

  export namespace eddsa {
    type Signature = {
      R8: bigint[]
      S: bigint
    }
    function prv2pub(privateKey: Buffer): bigint[]
    function signMiMCSponge(privateKey: Buffer, msg: bigint): Signature
    function verifyMiMCSponge(
      msg: bigint,
      signature: Signature,
      publicKey: bigint[],
    ): boolean
  }

  export namespace mimcsponge {
    function multiHash(inputs: bigint[]): bigint
  }

  export namespace pedersenHash {
    function hash(input: Buffer): bigint[]
  }

  function poseidon(inputs: bigint[]): bigint
}
