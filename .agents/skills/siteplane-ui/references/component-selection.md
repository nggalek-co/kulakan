# Component selection

Choose by behavior, not visual resemblance.

| Product need                                | Choose                                                             |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Small known choice set                      | `Select`                                                           |
| Search a larger local set                   | `Combobox`                                                         |
| Suggestions while typing                    | `Autocomplete`                                                     |
| Keyboard-first command palette              | `Command`                                                          |
| Triggered action list                       | `Menu`, or `DropdownMenu` for the same parts under shadcn's names  |
| Right-click or long-press actions           | `ContextMenu`                                                      |
| Short modal task                            | `Dialog`                                                           |
| Destructive confirmation                    | `AlertDialog`                                                      |
| Side form                                   | `Sheet`                                                            |
| Read-mostly row detail or mobile edge panel | `Drawer` or `DetailDrawer`                                         |
| Persistent application navigation           | `Sidebar` inside `DashboardShell`                                  |
| Boolean form value                          | `Checkbox`                                                         |
| Immediate boolean setting                   | `Switch`                                                           |
| Options presented as cards                  | `RadioGroup` or `CheckboxGroup` with a bordered `Label` per option |
| Change over time or an ordered set          | `LineChart`, or `AreaChart` when the volume matters                |
| Compare values across categories            | `BarChart`                                                         |
| Shares of one total                         | `PieChart`                                                         |
| Short ranked list of labeled values         | `BarList`                                                          |
| Small trend beside a figure                 | `Sparkline`                                                        |
| Exact values to read, sort or select        | `Table`                                                            |
| Several people in little space              | `AvatarGroup`, with `AvatarGroupCount` for the people not shown    |

There is no ConfirmDialog or ValidatedForm. For a confirmation, compose `AlertDialog`; the `@siteplane/alert-dialog-delete-account-example` example keeps the dialog open with a loading action while the request runs. For server validation, compose `Form` and `Field`; the `@siteplane/form-server-validation-example` example passes the errors the server returns, keyed by field name, to `Form`'s `errors`, and `FieldError` shows them. Keep the request and its pending and error state in application code.

Calendar/date/time controls, color controls, ListBox, TagGroup and Table are active. Use Table for current tabular sorting and selection; DataTable and SortableDataTable are not current exports. Use installed source instead of historical preview metadata.

If no active component fits, compose a product-owned boundary outside installed primitive files or report the missing capability. Do not disguise a raw visible control as Siteplane UI.

## Small actions

A button or an icon action has a kit owner too. Search for its verb before you add one, and never rebuild it from a lucide icon and state of your own.

| Small action                                         | Choose                                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Copy a value, such as a URL, an ID or an invite link | `CopyButton` from `copy-button`: the icon alone beside the value, or with a label such as Copy link                                                   |
| Copy from a read-only field                          | `CopyButton` with `profile="field-action"` in an `InputGroupAddon`                                                                                    |
| Show code that people copy                           | `CodeBlock` with `copyable`, from `code`                                                                                                              |
| Reveal a stored secret, such as an API key           | `CodeBlock` with `mask`, and `copyable` to copy it                                                                                                    |
| Show or hide a password while typing                 | `InputGroup` with a `field-action` Button and `RevealIcon`, as the `@siteplane/input-group-password-toggle-example` example does                      |
| Close an overlay                                     | Its close part: `DialogClose`, `AlertDialogClose`, `SheetClose`, `DrawerClose` or `PopoverClose`, or the popup's own close button (`showCloseButton`) |
| Confirm a destructive action                         | `AlertDialog`                                                                                                                                         |
| A menu entry that copies                             | `MenuItem` with the lucide `Copy` icon as its glyph; copy in its `onClick` with `useCopyToClipboard` from `copy-button`                               |
