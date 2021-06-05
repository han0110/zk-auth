import { AxiosInstance, AxiosRequestConfig } from 'axios'

export type Get<Query, Data> = (
  query?: Query,
  config?: AxiosRequestConfig,
) => Promise<Data>

export type Post<Body, Data> = (
  body: Body,
  config?: AxiosRequestConfig,
) => Promise<Data>

export type Delete<Query> = (
  query?: Query,
  config?: AxiosRequestConfig,
) => Promise<void>

export const parseTemplate = (
  template: string,
): { execute: (opitons?: Record<string, string>) => string } => {
  return {
    execute(options: Record<string, string> = {}) {
      return template.replace(
        new RegExp('{([^{}]+)}|([^{}]+)', 'g'),
        (_, expression, literal) => {
          if (expression) {
            return options[expression]
          }
          return literal
        },
      )
    },
  }
}

export function createGet<Query, Data>(
  client: AxiosInstance,
  url: string,
): Get<Query, Data> {
  const template = parseTemplate(url)
  return (params?: Query, config?: AxiosRequestConfig) =>
    client({
      ...config,
      url: template.execute(params as Record<string, string> | undefined),
      method: 'GET',
    }).then(({ data }) => data)
}

export function createPost<Body, Data>(
  client: AxiosInstance,
  url: string,
): Post<Body, Data> {
  return (body: Body, config?: AxiosRequestConfig) =>
    client({
      ...config,
      url,
      method: 'POST',
      data: body,
    }).then(({ data }) => data)
}

export function createDelete<Query>(
  client: AxiosInstance,
  url: string,
): Delete<Query> {
  const template = parseTemplate(url)
  return (params?: Query, config?: AxiosRequestConfig) =>
    client({
      ...config,
      url: template.execute(params as Record<string, string> | undefined),
      method: 'DELETE',
    }).then(() => void 0)
}
