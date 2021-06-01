declare module 'snarkjs' {
  namespace groth16 {
    export type Proof = {
      pi_a: string
      pi_b: string
      pi_c: string
    }
    export type PublicSignals = string[]
    export type VerificationKey = {
      protocol: string
      curve: string
      nPublic: number
      vk_alpha_1: string[]
      vk_beta_2: string[][]
      vk_gamma_2: string[][]
      vk_delta_2: string[][]
      vk_alphabeta_12: string[][][]
      IC: string[][]
    }
    function fullProve(
      witness: object,
      wasmPath: string,
      finalZKeyPath: string,
    ): Promise<{
      proof: Proof
      publicSignals: PublicSignals
    }>
    function verify(
      verificationKey: VerificationKey,
      publicSignals: PublicSignals,
      proof: Proof,
    ): Promise<boolean>
  }

  namespace r1cs {
    function info(r1csPath: string): Promise<{
      n8: number
      prime: bigint
      curve: any
      nVars: number
      nOutputs: number
      nPubInputs: number
      nPrvInputs: number
      nLabels: number
      nConstraints: number
    }>
  }

  namespace zKey {
    function newZKey(
      r1csPath: string,
      ptauPath: string,
      newZkeyPath: string,
    ): Promise<void>
    function beacon(
      newZkeyPath: string,
      finalZkeyPath: string,
      name: string,
      beaconHash: string,
      numIterationsExp: number,
    ): Promise<void>
    function exportVerificationKey(finalZkeyPath: string): Promise<any>
  }
}
