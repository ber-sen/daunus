import { tineAction } from '../../tineAction';

const payload = tineAction(<T>(payload: T) => payload, {
  action: 'payload',
});

export default payload;
