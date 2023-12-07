import { tineCtx } from '../../tineHelpers';
import task from './index';

describe('task', () => {
  it('should work', async () => {
    const action = task(() => ({
      success: true,
    }));

    const res = await action.run(tineCtx());

    expect(res).toStrictEqual({
      success: true,
    });
  });
});
