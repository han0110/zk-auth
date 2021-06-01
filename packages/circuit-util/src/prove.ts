import { groth16 } from 'snarkjs'
import { Witness, Proof, PublicSignals } from './type'

const prove = async (
  wasmPath: string,
  finalZkeyPath: string,
  witness: Witness,
): Promise<{ proof: Proof; publicSignals: PublicSignals }> => {
  const {
    proof: { pi_a: piA, pi_b: piB, pi_c: piC },
    publicSignals: [root, nullifierHash],
  } = await groth16.fullProve(
    {
      challenge: witness.challenge,
      identity_pk: witness.identityPk,
      identity_nullifier: witness.identityNullifier,
      identity_trapdoor: witness.identityTrapdoor,
      identity_branch_index: witness.identityBranchIndex,
      identity_siblings: witness.identitySiblings,
      auth_sig_r: witness.authSigR,
      auth_sig_s: witness.authSigS,
    },
    wasmPath,
    finalZkeyPath,
  )
  return {
    proof: {
      piA,
      piB,
      piC,
    },
    publicSignals: {
      challenge: witness.challenge.toString(),
      root,
      nullifierHash,
    },
  }
}

export default prove
