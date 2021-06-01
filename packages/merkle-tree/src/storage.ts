export type KeyValue = {
  key: string
  value: bigint
}

export interface Storage {
  read: (key: string) => Promise<bigint | undefined>
  readBatch: (keys: string[]) => Promise<Array<bigint | undefined>>
  readOrDefault: (key: string, defaultValue: bigint) => Promise<bigint>
  write: (key: string, value: bigint) => Promise<void>
  writeBatch: (keyValues: Array<KeyValue>) => Promise<void>
  delete: (key: string) => Promise<void>
}

export class MemStorage implements Storage {
  private mem: Record<string, bigint> = {}

  async read(key: string): Promise<bigint | undefined> {
    return this.mem[key]
  }

  async readBatch(keys: string[]): Promise<Array<bigint | undefined>> {
    return keys.map((key) => this.mem[key])
  }

  async readOrDefault(key: string, defaultValue: bigint): Promise<bigint> {
    return (await this.read(key)) || defaultValue
  }

  async write(key: string, value: bigint): Promise<void> {
    this.mem[key] = value
  }

  async writeBatch(
    keyValues: Array<{ key: string; value: bigint }>,
  ): Promise<void> {
    for (let i = 0; i < keyValues.length; i++) {
      this.mem[keyValues[i].key] = keyValues[i].value
    }
  }

  async delete(key: string): Promise<void> {
    delete this.mem[key]
  }
}
