import { tineAction } from '../../tineAction';

const struct = tineAction(
  {
    type: 'struct',
  },
  <T>(params: T) => params!,
);

export default struct;
