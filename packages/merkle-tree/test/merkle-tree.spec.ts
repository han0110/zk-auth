import { MerkleTree, MemStorage, PoseidonHasher } from '../src'
import { expect } from 'chai'

describe('MerkleTree', () => {
  it('should has right empty root for width 2 depth 32', async () => {
    const hasher = new PoseidonHasher()
    const merkleTree = new MerkleTree(new MemStorage(), hasher, 2, 32)
    expect(await merkleTree.root()).to.deep.eq(
      BigInt(
        '21443572485391568159800782191812935835534334817699172242223315142338162256601',
      ),
    )
  })

  it('should has right empty root for width 3 depth 20', async () => {
    const hasher = new PoseidonHasher()
    const merkleTree = new MerkleTree(new MemStorage(), hasher, 3, 20)
    expect(await merkleTree.root()).to.deep.eq(
      BigInt(
        '18144532011120474231214440768928481240514077961797329013465664570855737990740',
      ),
    )
  })
})
