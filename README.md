# Daunus
Opinionated edge-first library for TypeScript

## example: 

```typescript
const input = $input({ language: z.string() })

const useCase = $useCase("Say hello in language")
  .input(input)

  .handle(
    ({ scope, prompt }) => prompt`
      Say hello in ${scope.input.language}
    `
  )

const { data } = await useCase({ language: "Spanish" })
```
