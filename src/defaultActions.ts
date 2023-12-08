import condition from './actions/condition';
import shape from './actions/shape';
import response from './actions/response';
import process from './actions/process';
import parallel from './actions/parallel';
import serial from './actions/serial';
import task from './actions/task';
import wait from './actions/wait';

export const DEFAULT_ACTIONS = {
  shape,
  condition,
  response,
  parallel,
  process,
  serial,
  task,
  wait,
};
