/**
 * Frontend feature flags.
 *
 * CHAT_ENABLED — the user-to-user Chat feature (ChatPage + `/chat/*` API).
 * The backend `/chat/*` endpoints are NOT implemented yet, so the feature is
 * disabled: the chat button/badge are hidden and the unread-count poll is a
 * no-op (previously it spammed the console with 404s on every page). Flip this
 * to `true` once the backend chat API exists.
 */
export const CHAT_ENABLED = false;
