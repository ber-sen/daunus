import { tineAction } from '../../tineAction';

const shape = tineAction(<T>(payload: T) => payload, {
  action: 'shape',
});

export default shape;
