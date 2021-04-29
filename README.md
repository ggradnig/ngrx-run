# NgRx Run

Return side-effects as data from your NgRx reducers

## Summary

- Effects are **described as data** in your reducer's return statement
- When the reducer returns, the effects will be run
- Events created by the effects are turned into actions and dispatched back to the store
- Thereby, you can write webapps with a simple **action -> reducer -> (state + effects)** loop
- The reducer takes care of the entire business logic, instead of splitting it with @Effect

### Example

```ts
const fetchBlogPosts = createEffect('[Blog] Fetch blog posts', {
  call: () => fetch(`${apiUrl}/blog/posts`)
});

export function reducer(state, action) {
  switch (action.type) {
    case ActionTypes.loadBlogPosts:
      return [
        state,
        run(fetchBlogPosts, {
          complete: (blogPosts) => blogPostsFetched(blogPosts)
        })
      ];
    case ActionTypes.blogPostsFetched:
      return { ...state, blogPosts: action.blogPosts };
  }
}
```

### Real World Example App

The example app is a perfect place to start if you

- want to figure out what this library is about by directly digging into code or
- want to get tips for the practical usage with real-world use-cases

[RealWorld Example App](https://github.com/ggradnig/angular-ngrx-run-realworld-example-app)

## Motivation

With the built-in `@Effect` decorator pattern in NgRx, side effects live outside the `action -> reducer -> state`
loop.

As a result, reducers are usually not able to fully handle the business logic of an application. For example, say you
wanted to make an HTTP call only if the user is logged-in. HTTP calls cannot be made in the reducer, so the if-condition
must be checked in an `@Effect` instead. There, the logic is both harder to implement and to test because it is part of
an (Observable) stream instead of a synchronous function. In addition, the split between reducer and `@Effect`s makes it
more difficult to understand at a glance what exactly is going on with the application state when an action is
dispatched.

The **ngrx-run** library simplifies effect handling, by treating effects like any other data structure that is returned
by the reducer. To run a side effect, you just return an **effect description** together with the new state. The runtime
will take care of running the effect and calls your action creators when events are emitted. By treating effects in this
way, they become part of the `action -> reducer -> state` loop and work without external configuration like `@Effect`.

Using this library, you create more meaningful reducers, and your code becomes easier to follow. On top of that, you
create concise and valuable tests that guarantee the correctness of complete use cases. See more about that in
the [Testing](#testing) section.

## Setup

After installation, replace `StoreModule.forRoot` in your `AppModule` config with `EffectStoreModule.forRoot`.

The library is fully downwards-compatible with existing NgRx implementations. After configuring the module, your code
will work like before, and you won't notice any breaking changes. Now, you can add effects or migrate existing effects
one by one and switch to `ngrx-run` gracefully.

After you've added `EffectStoreModule`, a runtime is attached to your application that handles all effects that are
returned by reducers. Effects are run **right after** the new state was internally set in the store.

## Usage

### Declaring effects

Effects consist of four parts:

- **type**: An optional string that describes what happens in the side effect (used to help you debugging)
- **operation**: An operation (Promise, Observable or synchronous) that runs as a result of your reducer
- **event handlers**: Action creator functions that react to events of the asynchronous operation
- **subscription handlers**: Optional action creator that reacts to subscribing to Observables

The following example shows how to use effect creators to declare effects:

```ts
import { HttpClient } from '@angular/common/http';

const Effects = {
  fetchBlogPosts: createEffect('[Blog] Fetch blog posts', {
    call: (httpClient) => (apiUrl: string) => httpClient.get(`${apiUrl}/blog/posts`),
    using: [HttpClient]
  })
};
```

The first parameter in the `call` function is used to provide additional data from state and action. The remaining
parameters can be used to provide injectables from Angular's DI context. Make sure to declare the required injectables
in the `using` property. Note, that we currently only support globally-scoped injectables.

### Using effects

Instead of returning only the state, return an array / tuple with two elements. The first element is the new state and
the second property is the effect. Use `run` to join together the effect- and the handler functions.

```ts
import { run, StateWithEffects } from 'ngrx-run';

export function reducer(state: State, action): StateWithEffects<State> {
  switch (action.type) {
    case ActionTypes.loadBlogPosts:
      if (!state.loggedIn) return state;
      return [
        state,
        run(Effects.fetchBlogPosts(action), {
          next: (blogPosts) => blogPostsFetches(blogPosts),
          error: (err = blogPostsFetchError(err))
        })
      ];
    case ActionTypes.blogPostsFetched:
      return { ...state, blogPosts: action.blogPosts };
    case ActionTypes.blogPostsFetchError:
      return { ...state, error: action.error };
  }
}
```

### Observables and Subscriptions

You might have use-cases where you have a side-effect that returns an Observable stream . For example, a WebSocket
stream that continuously emits data.

The runtime automatically subscribes to the Observable. Afterwards, the `subscribed` action creator function declared in
the effect is called with a `SubscriptionToken`. This token should be stored in the state and can later on be used with
the pre-defined `unsubscribe` effect to unsubscribe from the Observable.

After unsubscribing successfully, the `complete` action creator function declared in the effect is called.

Here is a complete example with RxJS' WebSocket subject:

```ts
import { run, StateWithEffects, unsubscribe } from 'ngrx-run';

const Effects = {
  subscribeToBlogPosts: createEffect('[Blog] Subscribe to blog posts stream', {
    call: () => webSocket(`${wsUrl}/blog/posts`)
  })
};

export function reducer(
  state = { blogPosts: [], type: 'unsubscribed' },
  action
): StateWithEffects<State> {
  switch (action.type) {
    case Actions.subscribe:
      return [
        state,
        run(Effects.subscribeToBlogPosts(), {
          next: (blogPosts) => blogPostsUpdated(blogPosts),
          error: (blogPosts) => blogPostUpdateError(blogPosts),
          subscribed: (token) => subscribed(token)
        })
      ];
    case Actions.subscribed:
      return { ...state, type: 'subscribed', subscriptionToken: action.token };
    case Actions.unsubscribe:
      return [
        state,
        run(unsubscribe(state.subscriptionToken), {
          complete: () => unsubscribed()
        })
      ];
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
settings and retrieves correct data depending on the account settings. This can be quite difficult to set up and
maintain when the business logic is scattered around many classes and files.

Luckily with **ngrx-run** most of the test-relevant code of a use-case will live in one reducer. This makes it easy to
write readable and concise tests that guarantee that this use-case works correctly. These tests are able to bring much
more value to your code than traditional class-scoped unit tests.

The following example shows how you can write unit tests for use-cases using the `simulate` helper function:

```ts
import { simulate } from 'ngrx-run/testing';

it('should login, change the account settings and load 50 posts', async () => {
  const blogClient = mockProvider(BlogClient, {
    getBlogPosts$: (amount) => new Array(amount)
  });

  expect(
    await simulate(
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
// Import needed to register the `toHaveEffect` matcher
import 'ngrx-run/testing';

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

**ngrx-run** will likely increase the amount of code in your reducers, because action handlers will deal with larger
chunks of application state. This is actually good, because you'll make more deliberate decisions on what should happen
in response to events. Because you'll likely write more code, it is important to make it as concise as possible. The
library exports some utilities to help you do that.

### ActionsOf

Creates a union type of all actions of a module. Use it in addition with the `createAction` function of NgRx to define
exhaustive reducers that cover all possible actions.

```ts
import { createAction } from '@ngrx/store';
import { ActionsOf } from 'ngrx-run';

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

export function reducer(state, action: ActionsOf<typeof Actions>) {
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

The library enables a style of web development that is similar to other tools like:

- [Elm](https://elm-lang.org/)
- [redux-loop](https://github.com/redux-loop/redux-loop)
- [AppRun](https://apprun.js.org/)

Those tools have helpful tips that apply well to **ngrx-run**.

In his talk [Effects as data](https://www.youtube.com/watch?v=6EdXaWfoslc&ab_channel=ReactiveConf), Richard Feldman
gives a great introduction on how this style can help create better web applications.

In the future, this repository will include tips on how to apply this development style specifically to Angular
applications. Stay tuned 😉

Topics will include:

- Global and local state
  - Dealing with Angular Forms
- Using the type system to build bullet-proof apps
- Working with DOM APIs
