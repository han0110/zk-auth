import { groth16 } from 'snarkjs'
import { Witness, Proof, PublicSignals } from './type'

export const prove = async (
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
      identity_pk: witness.identity.keypair.pubKey,
      identity_nullifier: witness.identity.nullifier,
      identity_trapdoor: witness.identity.trapdoor,
      identity_branch_index: witness.merkleProof.path.map(({ branchIndex }) =>
        BigInt(branchIndex),
      ),
      identity_siblings: witness.merkleProof.path.map(
        ({ siblings }) => siblings,
      ),
      auth_sig_r: witness.signature.r8,
      auth_sig_s: witness.signature.s,
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
