import { tineAction } from '../../tineAction';
import { StatusError } from '../../types';

interface ExitParams<S extends number, D> {
  status: S;
  message?: string;
  data?: D;
}

const exit = tineAction(
  {
    type: 'exit',
  },
  <S extends number, D>(params: ExitParams<S, D>) =>
    new StatusError<S, D>(params.status, params.message ?? '', params.data),
);

export default exit;
