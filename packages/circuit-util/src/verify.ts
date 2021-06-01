import { groth16 } from 'snarkjs'
import { Proof, PublicSignals } from './type'

const verify = async (
  verificationKey: groth16.VerificationKey,
  proof: Proof,
  publicSignals: PublicSignals,
): Promise<boolean> => {
  return await groth16.verify(
    verificationKey,
    [publicSignals.root, publicSignals.nullifierHash, publicSignals.challenge],
    {
      pi_a: proof.piA,
      pi_b: proof.piB,
      pi_c: proof.piC,
    },
  )
}

export default verify
