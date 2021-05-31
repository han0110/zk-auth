const ZERO = BigInt(0)
const EIGHT = BigInt(8)
const BYTE_MASK = BigInt(255)

export const leBuf2Int = (buf: Buffer): bigint => {
  let num = ZERO
  for (let i = 0; i < buf.length; i++) {
    num += BigInt(buf[i]) << BigInt(i * 8)
  }
  return num
}

export const leInt2Buf = (num: bigint, len: number): Buffer => {
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
