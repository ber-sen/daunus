import { tineAction } from '../../tineAction';

const shape = tineAction(
  {
    type: 'shape',
  },
  <T>(payload: T) => payload,
);

export default shape;
