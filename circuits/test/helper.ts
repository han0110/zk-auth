import { join } from 'path'
import { expect } from 'chai'
import { tester } from 'circom'

const toHex = (n: bigint) => `0x${n.toString(16)}`

export type Circuit = {
  calculateWitness: (input: object, checkLC?: boolean) => Promise<bigint[]>
  filterWitnessBySymbol: (
    witness: bigint[],
    symbol: string | RegExp,
  ) => bigint[]
  expectWitnessEqual: (
    witness: bigint[],
    symbol: string | RegExp,
    expected: number | string | bigint | Array<number | string | bigint>,
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
    witness: bigint[],
    symbol: string | RegExp,
  ): bigint[] => {
    if (typeof symbol === 'string') {
      symbol = RegExp(`^main.${symbol}$`)
    }
    return Object.keys(circuit.symbols)
      .filter((s) => s.match(symbol) !== null)
      .map((s) => witness[circuit.symbols[s].varIdx])
  }

  circuit.expectWitnessEqual = (
    witness: bigint[],
    symbol: string | RegExp,
    expected: number | string | bigint | Array<number | string | bigint>,
  ) => {
    expect(
      (circuit as Circuit).filterWitnessBySymbol(witness, symbol).map(toHex),
      symbol.toString(),
    ).to.deep.eq(
      (Array.isArray(expected) ? expected : [expected]).map(BigInt).map(toHex),
    )
  }

  return circuit
}
