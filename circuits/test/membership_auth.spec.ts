import { randomBytes } from 'crypto'
import { MerkleTree, MemStorage, PoseidonHasher } from '@zk-auth/merkle-tree'
import {
  genEddsaKeyPair,
  genIdentityCommitment,
  signMsg,
  calculateNullifier,
  genIdentity,
} from '@zk-auth/identity'
import { Circuit, prepareCircuit } from './helper'

const buf2Bigint = (buf: Buffer) => BigInt(`0x${buf.toString('hex')}`)

describe('membership_auth', function () {
  this.timeout(60000)

  let circuit: Circuit
  let merkleTree: MerkleTree

  before(async () => {
    circuit = await prepareCircuit('membership_auth_2_20.circom')
  })

  after(() => circuit.release())

  beforeEach(() => {
    merkleTree = new MerkleTree(new MemStorage(), new PoseidonHasher(), 2, 20)
  })

  it('should pass test vector', async () => {
    const identity = {
      keypair: genEddsaKeyPair(Buffer.from('0'.repeat(64), 'hex')),
      nullifier: BigInt(0),
      trapdoor: BigInt(0),
    }
    const merkleProof = await merkleTree.insert(genIdentityCommitment(identity))
    const challenge = BigInt(0)
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
      '0xacacb437bf57fde7b2569dabe923346a41d4800fb6a76d7960b3376118eaa60',
    )
    circuit.expectWitnessEqual(
      witness,
      'nullifiers_hash',
      '0x12df9ae4958c1957170f9b04c4bc00c2d9e990cb76f719e40c04568b42bfa5af',
    )
  })

  it('should pass random test', async () => {
    const identity = genIdentity()
    const merkleProof = await merkleTree.insert(genIdentityCommitment(identity))
    const challenge = buf2Bigint(randomBytes(29))
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

    circuit.expectWitnessEqual(witness, 'root', await merkleTree.root())
    circuit.expectWitnessEqual(
      witness,
      'nullifiers_hash',
      calculateNullifier(identity, challenge),
    )
  })
})
