# NgRx Reducer Effects

Return side-effects as data from your NgRx reducers

## Summary

- Effects are **described as data** in your reducers return statement
- When the reducer returns, the described effects will be triggered by the runtime
- Events created by the effects are turned into actions and dispatched back to the store
- Thereby, you can write webapps with a simple **action -> reducer -> (state + effects)** loop

## Motivation

With the default `@Effect` decorator pattern in NgRx, side effects live outside the `action -> reducer -> state`
loop.

As a result, reducers are usually not able to handle the business logic of an application. For example, say you wanted
to make an HTTP call only if the user is logged-in. This business rule must be evaluated in an `@Effect`, where it is
both harder to implement and test than in the reducer. Reducers can only really deal with synchronous state transitions.
But if you think about it, why should there be a distinction between handling synchronous and asynchronous state
transitions?

The **ngrx-reducer-effects** library makes effects part of the `action -> reducer -> state` loop. You just return
**effects as additional data** together with the new state from your reducer.

Doing so, you create more meaningful reducers, and your code becomes easier to follow. On top of that, you create
concise and valuable tests that guarantee the correctness of complete use cases. See more about that in
the [Testing](#testing) section.

## Setup

After installation, replace `StoreModule.forRoot` in your `AppModule` config with `EffectStoreModule.forRoot`.

The library is fully downwards-compatible with existing NgRx implementations. After configuring the module, your code
will work like before, and you won't notice any breaking changes. Now, you can add effects or migrate existing effects
one by one and switch to `ngrx-reducer-effects` gracefully.

After you've added `EffectStoreModule`, a runtime is attached to your application that handles all effects that are
returned by reducers. Effects are run **right after** the new state was internally set in the store.

## Usage

### Declaring effects

Effects consist of four parts:

- **type**: An optional string that describes what happens in the side effect (used to help you debugging)
- **operation**: An asynchronous operation (Promise or Observable) that runs as a result of your reducer
- **event handlers**: Action creator functions that react to events of the asynchronous operation
- **subscription handlers**: Optional functions that react to subscribing / unsubscribing from Observables

You can declare effects as constants so that they can easily be referenced in unit tests later on. The way you would do
that is using:

```ts
const fetchBlogPosts = createReducerEffect({
  type: '[Blog] Fetch blog posts',
  operation: () => fetch(`${apiUrl}/blog/posts`),
  resolve: (blogPosts) => blogPostsFetched(blogPosts),
  reject: (error) => blogPostsFetchError(error)
});
```

### Using effects

Use `withEffects` as the return statement of your reducer to return side-effects. In this example, blog posts are only
loaded for logged-in users.

```ts
export function reducer(state: State = initialState, action: Action) {
  switch (action.type) {
    case ActionTypes.loadBlogPosts:
      return state.loggedIn ? withEffects(state, fetchBlogPosts) : state;
    case ActionTypes.blogPostsFetched:
      return { ...state, blogPosts: action.blogPosts };
    case ActionTypes.blogPostsFetchError:
      return { ...state, error: action.error };
  }
}
```

The same version with an inlined effect looks like this:

```ts
export function reducer(state: State = initialState, action: Action) {
  switch (action.type) {
    case ActionTypes.loadBlogPosts:
      return !state.loggedIn
        ? state
        : withEffects(state, {
            type: '[Blog] Fetch blog posts',
            operation: () => fetch(`${apiUrl}/blog/posts`),
            resolve: (blogPosts) => blogPostsFetched(blogPosts),
            reject: (error) => blogPostsFetchError(error)
          });
    case ActionTypes.blogPostsFetched:
      return { ...state, blogPosts: action.blogPosts };
  }
}
```

### Observables and Subscriptions

You might have use-cases where you need an Observable side-effect. For example, a WebSocket stream that continuously
emits data. Instead of defining `resolve` and `reject` as event handlers, you define `next`, `error` and `complete`.

The runtime automatically subscribes to the Observable. Afterwards, the `subscribe` action creator function declared in
the effect is called with a `SubscriptionToken`. This token should be stored in the state and can later on be used with
the pre-defined `unsubscribe` function to unsubscribe from the Observable.

After unsubscribing successfully, the optional `unsubscribe` action creator function declared in the effect is called.

Here is a complete example with RxJS' WebSocket subject:

```ts
export function reducer(
  state: State = { blogPosts: [], type: 'unsubscribed' },
  action: Action
): StateWithEffects<State> {
  switch (action.type) {
    case Actions.subscribe:
      return withEffects(state, {
        operation: () => webSocket(`${wsUrl}/blog/posts`),
        next: (blogPosts) => blogPostsUpdated(blogPosts),
        error: (blogPosts) => blogPostUpdateError(blogPosts),
        subscribe: (token) => subscribed(token)
      });
    case Actions.subscribed:
      return { ...state, type: 'subscribed', subscriptionToken: action.token };
    case Actions.unsubscribe:
      return withEffects(state, {
        operation: () => unsubscribe(state.subscriptionToken),
        unsubscribe: () => unsubscribed()
      });
      break;
    case Actions.unsubscribed:
      return { counter: state.counter, type: 'unsubscribed' };
    case Actions.blogPostsUpdated:
      return { ...state, blogPosts: blogPosts.concat(action.blogPosts) };
    case Actions.blogPostUpdateError:
      return { ...state, error: error.action };
  }
}
```

### Testing

Testing is a major aspect of this library, as `@Effect`-based unit tests are often not able to make guarantees for
complete use-cases. For example, you might want to test that the user logs in, then makes changes to their account
settings and retrieves correct data depending on the account settings. This can be quite difficult to setup and maintain
when the business logic is scattered around many classes and files.

Luckily with **ngrx-reducer-effects** most of the test-relevant code of a use-case will live in one reducer. This makes
it easy to write readable and concise tests that guarantee that this use-case works correctly. These tests are able to
bring much more value to your code than traditional class-scoped unit tests.

The following example shows how you can write unit tests for use-cases using the `reduceWithEffects` helper function:

```ts
it('should login, change the account settings and load 50 posts', async () => {
  const blogClient = mockProvider(BlogClient, {
    getBlogPosts$: (amount) => new Array(amount)
  });

  expect(
    await reduceWithEffects(
      reducer,
      [login(), changeAccountSettings({ numberOfPosts: 50 }), loadBlogPosts()],
      [blogClient]
    )
  ).toEqual({ blogPosts: new Array(50) });
});
```

Note that [@ngneat/spectator](https://github.com/ngneat/spectator) is used to concisely declare mock providers.

### Testing for effects

There might be times when a single action handler contains a lot of business logic and needs its own separate tests. For
these cases, you can use `expect().toHaveEffect()` to test if the result of the reducer contains an effect. Instead of
defining a chain of actions that transition your application in the tested state, you define an initial state and one
single tested action. Effects will not be run in this scenario.

```ts
it('should load posts if logged-in and amount is divisible by 10', async () => {
  expect(
    reducer({ numOfPosts: 40, loggedIn: true }, loadBlogPosts()).toHaveEffect(
      fetchBlogPosts
    )
  );
});
```

### Debugging

The library is fully compatible with
[Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=de).
Effects will be shown as part of the new state after an action. Note that effects won't really be stored in the state -
this representation is just for convenience.

## Utilities

**ngrx-reducer-effects** will likely increase the amount of code in your reducers, because action handlers will deal
with larger chunks of application state. This is actually good, because you'll make more deliberate decisions on what
should happen in response to events. Because you'll likely write more code, it is important to make it as concise as
possible. The library exports some utilities to help you do that.

### ActionsOf

Create a union type of all actions of a module. Use it in addition with the `createAction` function of NgRx.

```ts
import { createAction } from '@ngrx/store';

const Actions = {
  login: createAction('[Blog] Log-in'),
  changeAccountSettings: createAction(
    '[Blog] Change account settings',
    props<{ numberOfPosts: number }>()
  ),
  blogPostsFetched: createAction(
    '[Blog] Blog posts fetched',
    props<{ blogPosts: BlogPost[] }>()
  )
};

export function reducer(state: State, action: ActionsOf<typeof Actions>) {
  switch (action.type) {
    case Actions.login.type:
    // ...
    case Actions.changeAccountSettings.type:
    // ...
    case Actions.blogPostsFetched.type:
    // ...
  }
}
```

## Tips

The library enables a style of web development that is inspired by:

- [Elm](https://elm-lang.org/),
- [redux-loop](https://github.com/redux-loop/redux-loop)
- [AppRun](https://apprun.js.org/).

Those tools have helpful tips that apply well to **ngrx-reducer-effects**.

In his talk [Effects as data](https://www.youtube.com/watch?v=6EdXaWfoslc&ab_channel=ReactiveConf), Richard Feldman
gives a great introduction on how this style can help create better web applications.

In the future, this repository will include tips on how to apply this development style specifically to Angular
applications. Stay tuned 😉
