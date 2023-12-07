import { tineCtx } from '../../tineHelpers';
import shape from './index';

describe('shape', () => {
  it('should work', async () => {
    const action = shape({
      success: true,
    });

    const res = await action.run(tineCtx());

    expect(res).toStrictEqual({
      success: true,
    });
  });
});
