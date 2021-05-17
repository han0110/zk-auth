import { poseidon } from 'circomlib'
import { Circuit, prepareCircuit } from './helper'

describe('merkle_tree_inclusion_proof_2_2', function () {
  this.timeout(10000)

  let circuit: Circuit

  before(async () => {
    circuit = await prepareCircuit('merkle_tree_inclusion_proof_2_2.circom')
  })

  after(() => circuit.release())

  // TODO: implement ts merkle tree structure to help test
  it('should pass all testcases', async () => {
    const testcases = [
      {
        leaf: poseidon([0]),
        leaf_indexes: [0, 0],
        leaf_neighbors: [
          [poseidon([0])],
          [poseidon([poseidon([0]), poseidon([0])])],
        ],
        root: poseidon([
          poseidon([poseidon([0]), poseidon([0])]),
          poseidon([poseidon([0]), poseidon([0])]),
        ]),
      },
      {
        leaf: poseidon([3]),
        leaf_indexes: [0, 1],
        leaf_neighbors: [
          [poseidon([4])],
          [poseidon([poseidon([1]), poseidon([2])])],
        ],
        root: poseidon([
          poseidon([poseidon([1]), poseidon([2])]),
          poseidon([poseidon([3]), poseidon([4])]),
        ]),
      },
    ]

    await testcases.reduce(
      (p, { root, ...testcase }) =>
        p.then(async () => {
          const witness = await circuit.calculateWitness(testcase, true)
          circuit.expectWitnessEqual(witness, 'root', root)
        }),
      Promise.resolve(),
    )
  })
})
