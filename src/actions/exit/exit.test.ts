import exit from './index';

import { tineCtx } from '../../tineHelpers';
import { StatusError } from '../../types';

describe('wait', () => {
  it('should exit with message and status', async () => {
    const action = exit({
      status: 403,
      message: 'Forbidden',
    });

    try {
      await action.run(tineCtx());
    } catch (error) {
      expect(error).toBeInstanceOf(StatusError);
      expect(error).toHaveProperty('message', 'Forbidden');
      expect(error).toHaveProperty('status', 403);
    }
  });
});
