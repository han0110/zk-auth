import { MerkleTree, MemStorage, PoseidonHasher } from '@zk-auth/merkle-tree'
import {
  genEddsaKeyPair,
  genIdentityCommitment,
  signMsg,
} from '@zk-auth/identity'
import { Circuit, prepareCircuit } from './helper'

describe('membership_auth', function () {
  this.timeout(60000)

  let circuit: Circuit

  before(async () => {
    circuit = await prepareCircuit('membership_auth_2_20.circom')
  })

  after(() => circuit.release())

  it('should pass test vector', async () => {
    const hasher = new PoseidonHasher()
    const merkleTree = new MerkleTree(new MemStorage(), hasher, 2, 20)
    const identity = {
      keypair: genEddsaKeyPair(
        Buffer.from(
          '8be3937bff053009992db91ab535a6d30a0c5833295dafcdd5bedd511ea12b0c',
          'hex',
        ),
      ),
      nullifier: BigInt(
        '0xf0c623d54babc12cee524385aea22b80aeb56f7a175dc976a0ea419ab9748d',
      ),
      trapdoor: BigInt(
        '0x9a585677110c52443d3a3417dc9783c9cb1f8c7359c055ffbabbdc48c0e4e9',
      ),
    }
    const merkleProof = await merkleTree.insert(genIdentityCommitment(identity))
    const challenge = BigInt(
      '0xaab2e9be78b6b24a017bbf6a447ee57934ab653ce0c8190d3a233e87bb',
    )
    const signature = signMsg(identity.keypair.privKey, challenge)

    const witness = await circuit.calculateWitness(
      {
        challenge,
        identity_pk: identity.keypair.pubKey,
        identity_nullifier: identity.nullifier,
        identity_trapdoor: identity.trapdoor,
        identity_branch_index: merkleProof.path.map(
          ({ branchIndex }) => branchIndex,
        ),
        identity_siblings: merkleProof.path.map(({ siblings }) => siblings),
        auth_sig_r: signature.r8,
        auth_sig_s: signature.s,
      },
      true,
    )

    circuit.expectWitnessEqual(
      witness,
      'root',
      BigInt(
        '0x1ea305a1231e976bc3d481caafda0a2d175a396d289b06b6baba623b29ec66e',
      ),
    )
    circuit.expectWitnessEqual(
      witness,
      'nullifiers_hash',
      BigInt(
        '0x7687fabf23c4ef5fd99515b73e0fbfff7369e7d6617f40aba25b694440e66ac',
      ),
    )
  })
})
