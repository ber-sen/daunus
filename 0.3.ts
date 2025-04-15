type Trumpet<Name, Scope> = [Name, (props: { scope: Scope }) => any]

class Steps<const T0, const T1, const T2, const T3> {
  constructor(
    trumpets: [
      Trumpet<T0, {}>,
      Trumpet<T1, T0>,
      Trumpet<T2, T1>,
      Trumpet<T3, T2>
    ]
  ) {}
}

const cw = new Steps([
  ["greet", () => `Hello`],

  ["double", ({ scope }) => scope],

  ["greet2", ({ scope }) => scope],

  ["greet4", ({ scope }) => scope]
])
