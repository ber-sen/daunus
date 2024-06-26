import condition from "./actions/condition";
import struct from "./actions/struct";
import response from "./actions/response";
import process from "./actions/process";
import parallel from "./actions/parallel";
import serial from "./actions/serial";
import task from "./actions/task";
import exit from "./actions/exit";
import csv from "./actions/csv";
import define from "./actions/define";

export const DEFAULT_ACTIONS = {
  define,
  struct,
  condition,
  response,
  parallel,
  process,
  serial,
  task,
  exit,
  csv
};
