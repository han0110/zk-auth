import { Circuit, prepareCircuit } from '../helper'

describe('splicer_3', function () {
  let circuit: Circuit

  before(async () => {
    circuit = await prepareCircuit('util/splicer_3.circom')
  })

  after(() => circuit.release())

  it('should pass all testcases', async () => {
    const testcases = [
      {
        in: [1, 2, 3],
        item: 100,
        index: 0,
        out: [100, 1, 2, 3],
      },
      {
        in: [1, 2, 3],
        item: 100,
        index: 1,
        out: [1, 100, 2, 3],
      },
      {
        in: [1, 2, 3],
        item: 100,
        index: 2,
        out: [1, 2, 100, 3],
      },
      {
        in: [1, 2, 3],
        item: 100,
        index: 3,
        out: [1, 2, 3, 100],
      },
      {
        in: [1, 2, 3],
        item: 100,
        index: 4,
        out: [1, 2, 3, 0],
      },
    ]

    await testcases.reduce(
      (p, { out, ...testcase }) =>
        p.then(async () => {
          const witness = await circuit.calculateWitness(testcase, true)
          circuit.expectWitnessEqual(witness, /^main.out\[\d\]/, out)
        }),
      Promise.resolve(),
    )
  })
})
