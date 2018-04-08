# Redux Dutiful Thunk

[![npm version](https://img.shields.io/npm/v/redux-dutiful-thunk.svg)](https://www.npmjs.com/package/redux-dutiful-thunk)
[![circleci](https://circleci.com/gh/ryym/redux-dutiful-thunk.svg?style=svg)](https://circleci.com/gh/ryym/redux-dutiful-thunk)

This is a [Redux](https://redux.js.org/) middleware almost the same as [redux-thunk](https://github.com/gaearon/redux-thunk), but it respects Redux types.

## Motivation

In Redux Thunk, you need to pass a thunk function directly to `dispatch` to invoke it.

```js
// An action creator for Redux Thunk.
function incrementAsync() {
  return dispatch => {
    setTimeout(() => dispatch(increment()), 1000);
  };
}

// Dispatch a function.
store.dispatch(incrementAsync());
```

But this becomes a problem if you want to write code in a type-safe manner
because the `dispatch` function is supposed to accept Redux actions, not functions.

```js
// A Redux action consists of a unique `type` and zero or more extra arguments.
{ type: 'FETCH_USER', id: 30 }
```

So for example when you use Redux Thunk with [TypeScript](https://www.typescriptlang.org/),
you need to tweak Redux type definitions in some way
(I don't know about [flow](https://flow.org/) much but I guess a similar problem exists).
Therefore I could not find a good reason to use a function as a special action.
Instead, let's create a normal action to meet the Redux rule and match its type definitions.

```js
import {thunk} from 'redux-dutiful-thunk';

function incrementAsync() {
  // Wrap your thunk function by `thunk`.
  return thunk(async dispatch => {
      setTimeout(() => dispatch(increment()), 1000);
  });
}

// Now the action creator returns a normal action which contains a function you passed.
console.log(incrementAsync());
//=> { type: '@@redux-dutiful-thunk/THUNK', thunk: f, }

// So the `dispatch` function can take an action as usual, instead of a function.
store.dispatch(incrementAsync());
```

The difference with Redux Thunk is only the `thunk` wrapping.

```diff
 function incrementAsync() {
-  return dispatch => {
+  return thunk(async dispatch => {
       setTimeout(() => dispatch(increment()), 1000);
-  };
+  });
 }
```

## Installation

```
npm install redux-dutiful-thunk
```

## Usage

To enable Redux Dutiful Thunk, create a middleware and apply it to your store.

```js
import {createStore, applyMiddleware} from 'redux';
import {createThunkMiddleware} from 'redux-dutiful-thunk';
import rootReducer from './reducers/index';

const store = createStore(
  rootReducer,
  applyMiddleware(createThunkMiddleware())
);
```

### Custom Argument

Like Redux Thunk, you can inject a custom argument to your thunk actions.

```js
const store = createStore(
  rootReducer,
  applyMiddleware(createThunkMiddleware(api))
);

function fetchUser(id) {
  return thunk(async (dispatch, getState, api) => {
    const user = await api.fetchUser(id);
    dispatch({type: 'FETCH_USER_SUCCESS', user});
  });
}
```

### With TypeScript

This library is written in TypeScript so the type definitions are provided.

To make your `dispatch` function accept any thunk actions,
add `AnyThunkAction` to your action type.

```typescript
import {AnyThunkAction} from 'redux-dutiful-thunk';

type Action =
  | AnyThunkAction
  | {type: 'FETCH_USER'; id: number}
  | {type: 'DO_SOMETHING'};
```

To implement your thunk action creators easily,
we recommend to define a `Thunk` type using `ThunkAction`.

```typescript
import {thunk, ThunkAction} from 'redux-dutiful-thunk';
import {Action} from './action-type';
import {State} from './state';
import {API} from './api';
import {User} from './models'

type Thunk<R = void> = ThunkAction<State, Action, API, R>;

// A thunk action creator.
function fetchUser(id: number): Thunk<User> {
  // You can omit argument types.
  return thunk(async (dispatch, getState, api) => {
    return await api.fetchUser(id);
  });
}
```

### Thunk's Return Value

Because the `dispatch` function returns a given value as is,
you can get a return value of thunk function in Redux Thunk.

```js
const user = await dispatch(fetchUser(id));
console.log('got user', user);
```

But this cannot be done in Redux Dutiful Thunk.

```js
// fetchUser returns an action, not a user data.
const action = dispatch(fetchUser(id));
```

For this use case, thunk actions have a promise
that is resolved to a return value of your thunk function.

```js
const action = dispatch(fetchUser(id));
const user = await action.promise;

// So you can write like this
user = await dispatch(fetchUser(id)).promise;
```

Of course this promise is type safe.

### Specifying Thunk Type

All thunk actions have a same action type.
If you want to distinguish each thunk action, use `thunkAs` instead of `thunk`.
This allows you to specify a thunk type.

```typescript
import {thunkAs} from 'redux-dutiful-thunk';

function fetchUser(id: number): Thunk<User> {
  return thunkAs('FETCH_USER', async (dispatch, getState, api) => {
    return await api.fetchUser(id);
  });
}

const action = fetchUser(3);
console.log(action.thunkType === 'FETCH_USER'); //=> true
```

## API

### Base types

- `Thunk<State, Action, Context, R>`

    ```typescript
    (dispatch: Dispatch<Action>, getState: () => State, context: Context) => R
    ```

- `ThunkAction<State, Action, Context, R, T>`

    ```typescript
    {
      type: string,
      thunk: Thunk<State, Action, Context, R>,
      promise: Promise<R>,
      thunkType: T,
    }
    ```

### `thunk`

```typescript
(f: Thunk<S, A, C, R>) => ThunkAction<S, A, C, R, null>
```

### `thunkAs`

```typescript
(type: T, f: Thunk<S, A, C, R>) => ThunkAction<S, A, C, R, T>
```

### `isThunkAction`

```typescript
(action: AnyAction) => action is AnyThunkAction
```

### `createThunkMiddleware`

```typescript
(contxt?: C) => Middleware
```


See [src/index.ts](src/index.ts) for details.


