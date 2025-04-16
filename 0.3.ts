type Trumpet<Name, Scope> = [Name, (props: { scope: Scope }) => any]

function Steps<const T0, const T1, const T2, const T3>(
  ...trumpets: [
    Trumpet<T0, {}>,
    Trumpet<T1, T0>,
    Trumpet<T2, T1>,
    Trumpet<T3, T2>
  ]
) {}

const cw = Steps(
  ["greet", () => `Hello`],

  [
    "double",
    () => ({
      asd: "asdad"
    })
  ],

  ["greet2", ({ scope }) => scope],

  ["greet4", ({ scope }) => scope]
)
