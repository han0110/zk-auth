import { rmSync, readFileSync } from 'fs'
import { randomBytes } from 'crypto'
import { genIdentity, genIdentityCommitment, signMsg } from '@zk-auth/identity'
import { MerkleTree, MemStorage, PoseidonHasher } from '@zk-auth/merkle-tree'
import { setup, prove, verify } from '../src'
import { expect } from 'chai'

describe('circuit-util', function () {
  this.timeout(600000)

  const CIRCUIT_BASE_PATH = `${__dirname}/../../../circuits/build/membership_auth_2_20`
  const R1CS_PATH = `${CIRCUIT_BASE_PATH}.r1cs`
  const WASM_PATH = `${CIRCUIT_BASE_PATH}.wasm`
  const KEY_DIR = `${__dirname}/key`
  const FINAL_ZKEY_PATH = `${KEY_DIR}/membership_auth_2_20_final.zkey`
  const VERIFICATION_KEY_PATH = `${KEY_DIR}/membership_auth_2_20_vkey.json`

  before(async () => {
    rmSync(KEY_DIR, { recursive: true, force: true })
    await setup(R1CS_PATH, KEY_DIR)
  })

  after(() => {
    rmSync(KEY_DIR, { recursive: true, force: true })
  })

  it('should prove and verify', async () => {
    // prepare verification key
    const verificationKey = JSON.parse(
      readFileSync(VERIFICATION_KEY_PATH, 'utf-8'),
    )

    // prepare merkle tree
    const hasher = new PoseidonHasher()
    const merkleTree = new MerkleTree(new MemStorage(), hasher, 2, 20)

    // generate identity
    const identity = genIdentity()
    const identityCommitment = genIdentityCommitment(identity)

    // insert identity commitment into merkle tree
    await merkleTree.insert(identityCommitment)

    // retrieve merkle proof
    const merkleProof = await merkleTree.merkleProof(identityCommitment)

    // rand challenge and sign it by identity private key
    const challenge = BigInt(`0x${randomBytes(29).toString('hex')}`)
    const signature = signMsg(identity.keypair.privKey, challenge)

    // generate proof
    const { proof, publicSignals } = await prove(WASM_PATH, FINAL_ZKEY_PATH, {
      challenge,
      identityPk: identity.keypair.pubKey,
      identityNullifier: identity.nullifier,
      identityTrapdoor: identity.trapdoor,
      identityBranchIndex: merkleProof.path.map(({ branchIndex }) =>
        BigInt(branchIndex),
      ),
      identitySiblings: merkleProof.path.map(({ siblings }) => siblings),
      authSigR: signature.r8,
      authSigS: signature.s,
    })

    // verify proof
    expect(await verify(verificationKey, proof, publicSignals)).to.be.true
  })
})
