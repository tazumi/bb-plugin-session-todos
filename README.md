# bb-plugin-session-todos

A [BB](https://getbb.app) plugin that shows the agent's todo list inside the session, right above the composer.

You see what the agent is doing, what it finished, and what is left, without scrolling the chat.

## What it looks like

- Done tasks get a green check and are struck through.
- The task in progress gets a soft spinning loader.
- Tasks not started get an empty grey square.
- A progress bar and an "N of M" counter sit in the header.
- Click the header to collapse the list to one line with the current task.
- Click the cross to close the block.

Open [`docs/demo-todos.html`](docs/demo-todos.html) in a browser to see the expanded and collapsed states.

## Behavior

- The block appears only in a session whose agent has a todo list.
- Other sessions never show it.
- The collapsed state is remembered between sessions.
- Closing hides the block for the current list.
A new or changed list brings it back.
- Colors come from the active BB theme, light or dark.

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
It is refreshed every 1.5 seconds while the thread is busy, and once on each status change.
The block is a composer banner registered with `app.composer.customize`.

Whether `pendingTodos` is filled depends on the agent provider.
The plugin shows nothing when the field is empty.

## Related

[bb-plugin-session-activity](https://github.com/tazumi/bb-plugin-session-activity) animates the status icons in the sidebar.

## License

MIT
