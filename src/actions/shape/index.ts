import { tineAction } from '../../tineAction';

const shape = tineAction(
  {
    action: 'shape',
  },
  <T>(payload: T) => payload,
);

export default shape;
