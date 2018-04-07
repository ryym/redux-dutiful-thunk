import {Dispatch, Action, AnyAction, Middleware, MiddlewareAPI} from 'redux';

export type Thunk<S, A extends Action, C = null, R = void> = (
  dispatch: Dispatch<A>,
  getState: () => S,
  context: C,
) => Promise<R>;

export const ACTION_TYPE = '@@redux-dutiful-thunk/THUNK';
export type ActionType = typeof ACTION_TYPE;

export type ThunkType = any | null;

export type ThunkAction<S, A extends Action, C, R, T extends ThunkType> = {
  readonly type: ActionType;
  readonly thunk: Thunk<S, A, C, R>;
  readonly promise: Promise<R>;
  readonly thunkType: T;
};

export type AnyThunkAction<R = any, T extends ThunkType = any> = ThunkAction<
  any,
  AnyAction,
  any,
  R,
  T
>;

export function thunk<S, A extends Action, C, R>(
  f: Thunk<S, A, C, R>,
): ThunkAction<S, A, C, R, null> {
  return thunkAs(null, f);
}

export function thunkAs<S, A extends Action, C, R, T extends ThunkType>(
  thunkType: T,
  f: Thunk<S, A, C, R>,
): ThunkAction<S, A, C, R, T> {
  let _resolve: (r: R) => any;
  let _reject: (a: any) => any;
  const promise = new Promise<R>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  return {
    type: ACTION_TYPE,
    thunk: (dispatch, getState, context) => {
      f(dispatch, getState, context)
        .then(_resolve)
        .catch(_reject);
      return promise;
    },
    promise,
    thunkType,
  };
}

export function createThunkMiddleware<C = void, D extends Dispatch = Dispatch>(
  context?: C,
): Middleware<{}, any, D> {
  return <S>({dispatch, getState}: MiddlewareAPI<D, S>) => next => action => {
    if (action != null && isThunkAction(action)) {
      action.thunk(dispatch, getState, context);

      // Currently we return `action` without calling `next` like redux-thunk.
      // But this is just an action so we can pass it to `next` as well.
      return action;
    }
    return next(action);
  };
}

export function isThunkAction(action: AnyAction): action is AnyThunkAction {
  return action.type === ACTION_TYPE;
}
