import exit from './index';

import { tineCtx } from '../../tineHelpers';
import { StatusError } from '../../types';

class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call();

    throw new NoErrorThrownError();
  } catch (error: unknown) {
    return error as TError;
  }
};

describe('wait', () => {
  it('should exit with message and status', async () => {
    const action = exit({
      status: 403,
      message: 'Forbidden',
    });

    const error = await getError(async () => await action.run(tineCtx()));

    expect(error).not.toBeInstanceOf(NoErrorThrownError);
    expect(error).toBeInstanceOf(StatusError);
    expect(error).toHaveProperty('message', 'Forbidden');
    expect(error).toHaveProperty('status', 403);
  });
});
