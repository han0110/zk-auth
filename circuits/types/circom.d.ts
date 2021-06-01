declare module 'circom' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tester(path: string): Promise<any>
  function compiler(path: string, options: {}): Promise<void>
}
