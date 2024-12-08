import condition from "./actions/condition";
import struct from "./actions/struct";
import response from "./actions/response";
import process from "./actions/process";
import parallel from "./actions/parallel";
import serial from "./actions/serial";
import exit from "./actions/exit";
import csv from "./actions/csv";
import loop from "./actions/loop";

export const DEFAULT_ACTIONS = {
  struct,
  condition,
  response,
  parallel,
  process,
  serial,
  exit,
  csv,
  loop
};
