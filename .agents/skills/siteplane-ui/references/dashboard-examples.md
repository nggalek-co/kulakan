# Dashboard examples

- `DashboardShell` composes a responsive application frame around `Sidebar`, header, and main scroll region; it does not invent product navigation content.
- `FilterBar` belongs above data that can be searched or filtered.
- Table is the current table family, including sorting and selection. Do not import the historical DataTable or SortableDataTable names.
- `DetailDrawer` is for read-mostly row details. Use `Sheet` when the panel is primarily an edit/create form.
- `SettingsList` owns repeated labeled settings. Use a single `Switch` for one isolated setting.
- Keep product data, copy, navigation models, and permissions outside the installed primitive files.

- DashboardShell currently supports LTR layout and already owns SidebarProvider.
- SidebarProvider and DashboardShell write the desktop open state to the `sidebar_state` cookie and never read it back; pass `defaultOpen` from the server. `stateCookie` renames the cookie, and `stateCookie={false}` writes none.

## Start with a complete application

| Product task                                         | Installable example              | Adaptation                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editable preferences with validation, save and reset | `@siteplane/team-settings`       | Replace local `settings`/`saved` state and Form submit/reset handlers with the product's persistence contract.                                                                                                                                                                                                 |
| Filter, sort, inspect and archive records            | `@siteplane/resource-management` | Preserve stable resource IDs and Table sort state; replace the local archive mutation and add request errors.                                                                                                                                                                                                  |
| Responsive workspace navigation                      | `@siteplane/application-shell`   | Connect local `active` navigation to the router; remove the bounded demo wrapper and the `h-full` and `min-h-0` classes on the shell and its sidebar, so the top bar stays in view while the content scrolls (`stickyHeader={false}` lets the whole page scroll). DashboardShell already owns SidebarProvider. |

Use `shadcn view` to read an example before installation. Each example installs a complete file into `src/components/<example>.tsx` and resolves its component dependencies. These examples use local state; they do not supply a backend, authentication or authorization.

Read the matching page for the included states and callback boundaries: [Team settings](https://ui.siteplane.io/docs-markdown/examples/team-settings.md), [Resource management](https://ui.siteplane.io/docs-markdown/examples/resource-management.md), [Application shell](https://ui.siteplane.io/docs-markdown/examples/application-shell.md).
