import { join } from 'path'
import { expect } from 'chai'
import { tester } from 'circom'

export type Circuit = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  calculateWitness: (input: object, checkLC: boolean) => Promise<BigInt[]>
  getWitnessSymbol: (witness: BigInt[], symbol: string) => BigInt[]
  expectWitnessEqual: (
    witness: BigInt[],
    symbol: string,
    expected: number | string | BigInt | Array<number | string | BigInt>,
  ) => void
  release: () => Promise<void>
}

export const prepareCircuit = async (path: string): Promise<Circuit> => {
  const circuit = await tester(join(__dirname, 'circuit', path))
  await Promise.all([circuit.loadSymbols(), circuit.loadConstraints()])

  // eslint-disable-next-line @typescript-eslint/ban-types
  circuit.calculateWitness = async (input: object, checkLC = true) => {
    const witness = await circuit.witnessCalculator.calculateWitness(
      input,
      true,
    )
    if (checkLC) await circuit.checkConstraints(witness)
    return witness
  }

  circuit.getWitnessSymbol = (witness: BigInt[], symbol: string): BigInt[] => {
    return Object.keys(circuit.symbols)
      .filter((s) => s.startsWith(`main.${symbol}`))
      .map((s) => witness[circuit.symbols[s].varIdx])
  }

  circuit.expectWitnessEqual = (
    witness: BigInt[],
    symbol: string,
    expected: Array<number | string | BigInt>,
  ) => {
    expect(
      (Array.isArray(expected) ? expected : [expected]).map(BigInt),
    ).to.deep.eq(circuit.getWitnessSymbol(witness, symbol))
  }

  return circuit
}
