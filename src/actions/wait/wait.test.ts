import wait from './index';

import { tineCtx } from '../../tineHelpers';
import { Wait } from '../../types';

describe('wait', () => {
  it('should work throw wait exeption', async () => {
    const action = wait({
      delay: '1d',
    });

    const res = await action.run(tineCtx());

    expect(res.error).toStrictEqual(new Wait({ delay: '1d' }));
  });
});
