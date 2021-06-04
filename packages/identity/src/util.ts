const ZERO = BigInt(0)
const ONE = BigInt(1)
const EIGHT = BigInt(8)
const BYTE_MASK = BigInt(255)

export const buf2BigInt = (buf: Buffer): bigint => {
  let num = ZERO
  for (let i = 0; i < buf.length; i++) {
    for (let j = 0; j < 8; j++) {
      num += ((BigInt(buf[i]) >> BigInt(7 - j)) & ONE) << BigInt(i * 8 + j)
    }
  }
  return num
}

export const bigInt2Buf = (num: bigint, len: number): Buffer => {
  let i = 0
  const buf = Buffer.alloc(len)
  while (num > ZERO && i < buf.length) {
    buf[i] = Number(num & BYTE_MASK)
    num >>= EIGHT
    i++
  }
  if (!(num === ZERO)) {
    throw new Error('Number does not fit in this length')
  }
  return buf
}

export const bigInt2BitRevBuf = (num: bigint, len: number): Buffer => {
  const buf = Buffer.alloc(len)
  for (let i = 0; i < buf.length; i++) {
    for (let j = 0; j < 8; j++) {
      buf[i] |= Number(num & ONE) << (7 - j)
      num >>= ONE
      if (num === ZERO) {
        return buf
      }
    }
  }
  return buf
}
