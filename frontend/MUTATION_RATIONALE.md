# Mutation rationale

The frontend contains no `let` or `var` declarations. `npm run lint` enforces
this for application code, component tests, and Node tests through
`quality/check-no-let-var.mjs`.

Application/domain transformations use immutable arrays and objects. The
remaining assignments and mutating method calls are limited to the following
API boundaries, where object identity or an external imperative contract is
required.

## External stores and caches

- `shared/api/appSession.ts` serializes cart writes, invalidates stale requests,
  and deduplicates authentication/refresh calls. Its private runtime and
  listener `Set` must evolve between calls to implement `useSyncExternalStore`.
  Every published `AppSessionState` is replaced with a new snapshot; callers
  never receive the mutable runtime.
- `features/kitchen/model/kitchen.demo.ts` and `shared/api/demoBackend.ts` are
  equivalent external stores for local/demo data. They replace snapshots rather
  than editing domain objects, and their listener sets only track callback
  identity for subscribe/unsubscribe.
- The private `Map` instances in recipe discovery, recipe detail, and cooking
  idempotency modules retain data across route unmounts or retries. Values are
  replaced, the maps are not exported, and their mutation is non-reactive.

## React lifecycle and browser APIs

- `useRef().current` is used for timers, native pointer events, request
  cancellation, re-entry locks, and animation-frame values. These values must
  change without scheduling React renders, and React defines refs as the
  mutable escape hatch for this purpose.
- `AbortController.abort()`, event listener registration, Web Storage, and
  resetting a file input are imperative browser contracts. In particular, a
  file input cannot be cleared through an immutable value prop.

## Three.js and Canvas

- Three.js vectors, matrices, cameras, layers, materials, textures, scene
  graphs, and instanced GPU buffers are designed for in-place updates. Replacing
  them each animation frame would break retained object identity and cause
  unnecessary allocations or React reconciliation.
- Canvas drawing state (`fillStyle`, `font`, dimensions, and similar fields) is
  also exposed only through an imperative context. Each canvas/texture is newly
  created and owned locally before it is returned.
- Fixture geometry uses two private append-only construction buffers. They do
  not escape until construction is complete, and returned boxes are never
  modified.

## Tests

Test-only mutation is limited to third-party spies/stubs, a simulated HTTP
cookie jar, Three.js setup/disposal, and the private queue/visited set in the
breadth-first reachability test. It does not alter application state or weaken
the production immutability guarantees.
