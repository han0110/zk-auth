import { Mutex } from 'async-mutex'
import { Hasher } from './hasher'
import { Storage } from './storage'

const splitChunk = <T>(array: T[], size: number): T[][] => {
  const chunks = Array(Math.ceil(array.length / size))
  for (let i = 0; i < chunks.length; i++) {
    chunks[i] = array.slice(i * size, (i + 1) * size)
  }
  return chunks
}

export type MerklePath = {
  depth: number
  index: number
  branchIndex: number
  siblingIndexes: number[]
}[]

export type MerkleProof = {
  root: bigint
  path: {
    depth: number
    index: number
    branchIndex: number
    siblings: bigint[]
  }[]
}

export type MerkleTreeStorageKeyFn = {
  root: () => string
  size: () => string
  element: (depth: number, index: number) => string
  index: (element: bigint) => string
}

export type MerkleTreeOption = {
  zero?: bigint
  storageKeyFn?: MerkleTreeStorageKeyFn
}

export class MerkleTree {
  private mutex: Mutex
  private maxIndex: bigint
  private zeros: bigint[]
  private storageKeyFn: MerkleTreeStorageKeyFn

  constructor(
    private storage: Storage,
    private hasher: Hasher,
    public width: number,
    public depth: number,
    {
      zero = BigInt(0),
      storageKeyFn: { root, size, element, index } = {
        root: () => 'root',
        size: () => 'size',
        element: (depth: number, index: number) => `element_${depth}_${index}`,
        index: (element: bigint) => `index_${element}`,
      },
    }: MerkleTreeOption = {},
  ) {
    this.mutex = new Mutex()
    this.maxIndex = BigInt(width) ** BigInt(depth)
    this.zeros = Array(this.depth + 1)
    this.zeros[this.depth] = zero
    for (let i = depth - 1; i >= 0; i--) {
      this.zeros[i] = hasher.hash(Array(width).fill(this.zeros[i + 1]))
    }
    this.storageKeyFn = { root, size, element, index }
  }

  async root(): Promise<bigint> {
    const root = await this.storage.readOrDefault(
      this.storageKeyFn.root(),
      this.zeros[0],
    )
    return root
  }

  async size(): Promise<number> {
    return Number(
      await this.storage.readOrDefault(this.storageKeyFn.size(), BigInt(0)),
    )
  }

  async insert(element: bigint): Promise<MerkleProof> {
    const release = await this.mutex.acquire()

    try {
      const size = await this.size()
      const merkleProof = await this.update(size, element)
      await this.storage.write(this.storageKeyFn.size(), BigInt(size + 1))
      return merkleProof
    } finally {
      release()
    }
  }

  async delete(index: number): Promise<void> {
    const release = await this.mutex.acquire()

    try {
      await this.update(index, BigInt(0))
    } finally {
      release()
    }
  }

  async merkleProof(indexOrElement: number | bigint): Promise<MerkleProof> {
    let index: number
    if (typeof indexOrElement === 'bigint') {
      const elementIndex = await this.storage.read(
        this.storageKeyFn.index(indexOrElement),
      )
      if (!elementIndex === undefined) {
        throw new Error(`element ${indexOrElement.toString()} not found`)
      }
      index = Number(elementIndex)
    } else {
      index = indexOrElement
    }
    if (BigInt(index) > this.maxIndex) {
      throw new Error(`index should be less than ${this.maxIndex}`)
    }

    const root = await this.root()
    const merklePath = this.merklePath(index)
    const pathSiblings = splitChunk(
      await this.storage.readBatch(
        merklePath.reduce(
          (previous, { depth, siblingIndexes }) => [
            ...previous,
            ...siblingIndexes.map((index) =>
              this.storageKeyFn.element(depth, index),
            ),
          ],
          Array<string>(),
        ),
      ),
      this.width - 1,
    )

    return {
      root,
      path: merklePath.map(({ depth, index, branchIndex }, i) => ({
        depth,
        index,
        branchIndex,
        siblings: pathSiblings[i].map(
          (sibling) => sibling || this.zeros[depth],
        ),
      })),
    }
  }

  private async update(index: number, element: bigint): Promise<MerkleProof> {
    const merkleProof = await this.merkleProof(index)

    const keyValues = [
      {
        key: this.storageKeyFn.element(this.depth, index),
        value: element,
      },
      ...(element === BigInt(0)
        ? []
        : [
            {
              key: this.storageKeyFn.index(element),
              value: BigInt(index),
            },
          ]),
    ]
    for (let i = 0; i < merkleProof.path.length; i++) {
      const { depth, branchIndex, siblings } = merkleProof.path[i]
      const next = merkleProof.path[i + 1]

      const branch = [...siblings]
      branch.splice(branchIndex, 0, element)
      element = this.hasher.hash(branch)

      keyValues.push({
        key:
          depth === 1
            ? this.storageKeyFn.root()
            : this.storageKeyFn.element(next.depth, next.index),
        value: element,
      })
    }

    await this.storage.writeBatch(keyValues)

    merkleProof.root = keyValues[keyValues.length - 1].value
    return merkleProof
  }

  private merklePath(index: number): MerklePath {
    const path = []

    for (let i = this.depth; i > 0; i--) {
      const parent = Math.floor(index / this.width)
      const branch = parent * this.width

      const siblingIndexes = []
      for (let j = branch; j < branch + this.width; j++) {
        if (j !== index) {
          siblingIndexes.push(j)
        }
      }

      path.push({
        depth: i,
        index,
        branchIndex: index % this.width,
        siblingIndexes,
      })
      index = parent
    }

    return path
  }
}

export default MerkleTree
