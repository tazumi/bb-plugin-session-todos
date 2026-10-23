# bb-plugin-session-todos

A BB plugin that shows the agent's todo list inside the session, right above the composer.

- Done tasks get a green check and are struck through.
- The task in progress gets a spinning loader.
- Tasks not started get an empty grey square.
- A progress bar and an "N of M" counter sit in the header.
- Click the header to collapse the list to one line with the current task. The choice is remembered.

The block appears only while the agent has a todo list.
Colours come from the active BB theme.

## Install

```
bb plugin install git:github.com/tazumi/bb-plugin-session-todos
```

## Develop

```
npm install
bb plugin build .
bb plugin install .
bb plugin reload session-todos
```

## How it works

The list is the thread's `pendingTodos` from `sdk.status.get({ threadId })`.
It is refreshed every 1.5 s while the thread is busy, and once on each status change.
The block is a composer banner registered through `app.composer.customize`.

Whether `pendingTodos` is filled depends on the agent provider.

## License

MIT
