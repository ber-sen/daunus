import wait from './index';

import { tineCtx } from '../../tineHelpers';
import { Wait } from '../../types';

describe('wait', () => {
  it('should work throw wait exeption', async () => {
    const action = wait({
      delay: 1500,
    });

    try {
      await action.run(tineCtx());
    } catch (error) {
      expect(error).toBeInstanceOf(Wait);
      expect(error).toHaveProperty('message', 'Wait');
    }
  });
});
