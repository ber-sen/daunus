import condition from "./actions/condition"
import struct from "./actions/struct"
import steps from "./actions/steps"
import exit from "./actions/exit"
import csv from "./actions/csv"
import loop from "./actions/loop"

export const DEFAULT_ACTIONS = {
  struct,
  condition,
  steps,
  exit,
  csv,
  loop
}
