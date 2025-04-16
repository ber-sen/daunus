type Trumpet<Name, Scope> = [Name, (props: { scope: Scope }) => any]

interface Steps {
  <const T0>(...trumpets: [Trumpet<T0, {}>]): number
  <const T0, const T1>(...trumpets: [Trumpet<T0, {}>, Trumpet<T1, T0>]): number
  <const T0, const T1, const T2>(
    ...trumpets: [Trumpet<T0, {}>, Trumpet<T1, T0>, Trumpet<T2, T1>]
  ): number
  <const T0, const T1, const T2, const T3>(
    ...trumpets: [
      Trumpet<T0, {}>,
      Trumpet<T1, T0>,
      Trumpet<T2, T1>,
      Trumpet<T3, T2>
    ]
  ): number
  <const T0, const T1, const T2, const T3, const T4>(
    ...trumpets: [
      Trumpet<T0, {}>,
      Trumpet<T1, T0>,
      Trumpet<T2, T1>,
      Trumpet<T3, T2>,
      Trumpet<T4, T3>
    ]
  ): number
}

const Steps = (() => {
  return {} as any
}) as Steps

const UseCase = (name: string) => {
  const steps = (() => {
    return name as any
  }) as Steps

  return {
    steps,
    input: () => ({ steps })
  }
}

const hello = UseCase("Hello")
  .input()

  .steps(
    ["first step", () => Math.random() > 0.5],

    ["second step", ({ scope }) => scope]
  )
