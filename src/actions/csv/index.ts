import { $action } from "../../daunus_action";
import { DaunusReadable } from "../../types";
import { writeRows } from "./lib";
import { CSVParams } from "./types";

const csv = $action(
  { type: "csv" },
  () =>
    <T extends {}>({ columns, rows }: CSVParams<T>) => {
      const { writable, readable } = new TransformStream();

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

      return new DaunusReadable(readable, "text");
    }
);

export default csv;
