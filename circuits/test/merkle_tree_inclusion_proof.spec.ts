import { Circuit, prepareCircuit } from './helper'
import { MerkleTree, MemStorage, PoseidonHasher } from '@zk-auth/merkle-tree'

describe('merkle_tree_inclusion_proof', function () {
  this.timeout(60000)

  const circuits: Record<string, Circuit> = {}

  after(() =>
    Promise.all(Object.values(circuits).map((circuit) => circuit.release())),
  )

  const fuzzyTest = async (
    { width, depth }: { width: number; depth: number },
    round: number,
  ): Promise<void> => {
    const circuitPath = `merkle_tree_inclusion_proof_${width}_${depth}.circom`
    if (!circuits[circuitPath]) {
      circuits[circuitPath] = await prepareCircuit(circuitPath)
    }
    const circuit = circuits[circuitPath]
    const hasher = new PoseidonHasher()

    for (let i = 0; i < round; i++) {
      const merkleTree = new MerkleTree(new MemStorage(), hasher, width, depth)
      const elements = [...Array(Math.floor(100 * Math.random()) + 1)].map(() =>
        hasher.hash([BigInt(Math.floor((1 << 30) * Math.random()))]),
      )
      const index = Math.floor(elements.length * Math.random())
      await elements.reduce(
        (p, element) => p.then(() => merkleTree.insert(element)),
        <any>Promise.resolve(),
      )

      const merkleProof = await merkleTree.merkleProof(index)
      try {
        const witness = await circuit.calculateWitness(
          {
            element: elements[index],
            branch_index: merkleProof.path.map(
              ({ branchIndex }) => branchIndex,
            ),
            siblings: merkleProof.path.map(({ siblings }) => siblings),
          },
          true,
        )
        circuit.expectWitnessEqual(witness, 'root', await merkleTree.root())
      } catch (error) {
        console.log('index', index)
        console.log({
          element: elements[index],
          branch_index: merkleProof.path.map(({ branchIndex }) => branchIndex),
          siblings: merkleProof.path.map(({ siblings }) => siblings),
        })
        throw error
      }
    }
  }

  it('should pass fuzzy test of width 2 depth 32', async () => {
    await fuzzyTest({ width: 2, depth: 32 }, 10)
  })

  it('should pass fuzzy test of width 3 depth 20', async () => {
    await fuzzyTest({ width: 3, depth: 20 }, 10)
  })
})
