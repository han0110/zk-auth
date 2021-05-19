export type KeyValue = {
  key: string
  value: BigInt
}

export interface Storage {
  read: (key: string) => Promise<BigInt | undefined>
  readBatch: (keys: string[]) => Promise<Array<BigInt | undefined>>
  readOrDefault: (key: string, defaultValue: BigInt) => Promise<BigInt>
  write: (key: string, value: BigInt) => Promise<void>
  writeBatch: (keyValues: Array<KeyValue>) => Promise<void>
  delete: (key: string) => Promise<void>
}

export class MemStorage implements Storage {
  private mem: Record<string, BigInt> = {}

  async read(key: string): Promise<BigInt | undefined> {
    return this.mem[key]
  }

  async readBatch(keys: string[]): Promise<Array<BigInt | undefined>> {
    return keys.map((key) => this.mem[key])
  }

  async readOrDefault(key: string, defaultValue: BigInt): Promise<BigInt> {
    return (await this.read(key)) || defaultValue
  }

  async write(key: string, value: BigInt): Promise<void> {
    this.mem[key] = value
  }

  async writeBatch(
    keyValues: Array<{ key: string; value: BigInt }>,
  ): Promise<void> {
    for (let i = 0; i < keyValues.length; i++) {
      this.mem[keyValues[i].key] = keyValues[i].value
    }
  }

  async delete(key: string): Promise<void> {
    delete this.mem[key]
  }
}
