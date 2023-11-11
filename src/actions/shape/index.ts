import { tineAction } from '../../tineAction';

const shape = tineAction(
  {
    type: 'shape',
  },
  <T>(params: T) => params,
);

export default shape;
