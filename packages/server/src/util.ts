import { Context, Middleware, Next } from 'koa'
import dayjs from 'dayjs'

export const log = (message: string): void =>
  console.log(`[${dayjs().format('HH:mm:ss')}]: ${message}`)

const serializeBigInt = (obj: any): any => {
  if (typeof obj === 'bigint') {
    return `0x${obj.toString(16)}`
  } else if (Array.isArray(obj)) {
    return obj.map(serializeBigInt)
  } else if (typeof obj == 'object') {
    const newObj: any = {}
    const keys = Object.keys(obj)
    keys.forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      newObj[k] = serializeBigInt(obj[k])
    })
    return newObj
  } else {
    return obj
  }
}

const deserializeBigInt = (obj: any): any => {
  if (
    typeof obj == 'string' &&
    (/^[0-9]+$/.test(obj) || /^0x[0-9a-f]+$/i.test(obj))
  ) {
    return BigInt(obj)
  } else if (Array.isArray(obj)) {
    return obj.map(deserializeBigInt)
  } else if (typeof obj == 'object') {
    const newObj: any = {}
    const keys = Object.keys(obj)
    keys.forEach((k) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      newObj[k] = deserializeBigInt(obj[k])
    })
    return newObj
  } else {
    return obj
  }
}

export const serdeBigInt = ({
  req = false,
}: { req?: boolean } = {}): Middleware => {
  if (req) {
    return async (ctx: Context, next: Next) => {
      ctx.params = deserializeBigInt(ctx.params)
      ctx.request.body = deserializeBigInt(ctx.request.body)
      return next()
    }
  }
  return async (ctx: Context, next: Next) => {
    await next()
    ctx.body = serializeBigInt(ctx.body)
  }
}
