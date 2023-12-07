import condition from './index';

import { tineCtx } from '../../tineHelpers';
import { tineVar } from '../../tineVar';
import shape from '../shape';

describe('shape', () => {
  it('should work', async () => {
    const action = condition({
      if: true,
      then: tineVar(shape({ success: true })),
    });

    const res = await action.run(tineCtx());

    expect(res).toStrictEqual({
      success: true,
    });
  });
});
