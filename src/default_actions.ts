import condition from "./actions/condition";
import struct from "./actions/struct";
import steps from "./actions/steps";
import parallel from "./actions/parallel";
import serial from "./actions/serial";
import exit from "./actions/exit";
import csv from "./actions/csv";
import loop from "./actions/loop";

export const DEFAULT_ACTIONS = {
  struct,
  condition,
  steps,
  parallel,
  serial,
  exit,
  csv,
  loop
};
