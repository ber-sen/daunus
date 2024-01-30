import { tineAction } from '../../tineAction';
import { Wait } from '../../types';

type WaitParams =
  | {
      delay: string;
    }
  | {
      until: Date;
    };

const wait = tineAction(
  {
    type: 'wait',
  },
  (params: WaitParams) => {
    return new Wait(params);
  },
);

export default wait;
