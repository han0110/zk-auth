import { join } from 'path'
import { expect } from 'chai'
import { tester } from 'circom'

export type Circuit = {
  calculateWitness: (input: object, checkLC?: boolean) => Promise<BigInt[]>
  filterWitnessBySymbol: (
    witness: BigInt[],
    symbol: string | RegExp,
  ) => BigInt[]
  expectWitnessEqual: (
    witness: BigInt[],
    symbol: string | RegExp,
    expected: number | string | BigInt | Array<number | string | BigInt>,
  ) => void
  release: () => Promise<void>
}

export const prepareCircuit = async (path: string): Promise<Circuit> => {
  const circuit = await tester(join(__dirname, 'circuit', path))
  await Promise.all([circuit.loadSymbols(), circuit.loadConstraints()])

  circuit.calculateWitness = async (input: object, checkLC = true) => {
    const witness = await circuit.witnessCalculator.calculateWitness(
      input,
      true,
    )
    if (checkLC) await circuit.checkConstraints(witness)
    return witness
  }

  circuit.filterWitnessBySymbol = (
    witness: BigInt[],
    symbol: string | RegExp,
  ): BigInt[] => {
    if (typeof symbol === 'string') {
      symbol = RegExp(`^main.${symbol}$`)
    }
    return Object.keys(circuit.symbols)
      .filter((s) => s.match(symbol) !== null)
      .map((s) => witness[circuit.symbols[s].varIdx])
  }

  circuit.expectWitnessEqual = (
    witness: BigInt[],
    symbol: string | RegExp,
    expected: Array<number | string | BigInt>,
  ) => {
    expect(
      circuit.filterWitnessBySymbol(witness, symbol),
      symbol.toString(),
    ).to.deep.eq((Array.isArray(expected) ? expected : [expected]).map(BigInt))
  }

  return circuit
}
