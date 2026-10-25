/**
 * Frontend feature flags.
 *
 * CHAT_ENABLED — direct member messaging (ChatPage + the `/chat/*` API, covered by the backend's
 * BusinessSocialNetworkTest). Shown to platform operators; real-time when Pusher is configured,
 * otherwise the page and badge refresh on a timer.
 */
export const CHAT_ENABLED = true;
