🚧 Under development

# Redux Dutiful Thunk

This is a Redux middleware almost the same as [redux-thunk](https://github.com/gaearon/redux-thunk), but it respects Redux types.

In redux-thunk, you need to dispatch a function that is not a Redux action.

```js
function incrementAsync() {
  return dispatch => {
    setTimeout(() => dispatch(increment()), 1000);
  };
}

store.dispatch(incrementAsync());
```

Instead, let's create a normal action to meet Redux rules and type systems.

```ts
import {thunk} from 'redux-dutiful-thunk';

function incrementAsync() {
  // Wrap your thunk function by the `thunk` function.
  return thunk(async dispatch => {
      setTimeout(() => dispatch(increment()), 1000);
  });
}

console.log(incrementAsync());
// {
//   type: '@@redux-dutiful-thunk/THUNK',
//   thunk: f, /* A function you passed to `thunk` */
// }

// Now the `dispatch` function can take an action insead of a function :)
store.dispatch(incrementAsync());
```
