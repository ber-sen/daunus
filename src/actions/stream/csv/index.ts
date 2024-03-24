import transform from "../transform";
import { $action } from "../../..";
import { writeRows } from "./lib";
import { CSVParams } from "./types";

const csv = $action(
  { type: "stream.csv" },
  ({ ctx }) =>
    async <T extends {}>({ columns, rows }: CSVParams<T>) => {
      const {
        data: { writable, readable }
      } = await transform({}).run(ctx);

      (async () => {
        const writer = writable.getWriter();

        if (rows.length > 0) {
          if (!columns) {
            columns = Object.keys(rows[0]).map((key) => ({
              key: key as keyof T,
              label: key,
              format: (x: any) => x
            }));
          }
          await writeRows(writer, rows, columns);
        }
        await writer.close();
      })();

      return readable;
    }
);

export default csv;
