import { TransformStream } from "isomorphic-web-streams"
import { $action } from "../../daunus_action"
import { writeRows } from "./lib"
import { CSVParams } from "./types"

const csv = $action(
  { type: "csv" },
  () =>
    <T extends {}>({ columns, rows }: CSVParams<T>) => {
      const { writable, readable } = new TransformStream()

      ;(async () => {
        const writer = writable.getWriter()
        const reader = rows.getReader()

        try {
          let rowResult = await reader.read()

          if (!rowResult.done) {
            if (!columns) {
              columns = Object.keys(rowResult.value).map((key) => ({
                key: key as keyof T,
                label: key,
                format: (x: any) => x
              }))
            }

            await writeRows(writer, [], columns, true)

            while (!rowResult.done) {
              const row = rowResult.value
              await writeRows(writer, [row], columns)
              rowResult = await reader.read()
            }
          }
        } catch (error) {
          console.error("Error reading from input stream:", error)
        } finally {
          await writer.close()
        }
      })()

      return readable
    }
)

export default csv
