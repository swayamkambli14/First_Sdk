# Auth

Types:

- <code><a href="./src/resources/auth.ts">Tier</a></code>
- <code><a href="./src/resources/auth.ts">UserProfile</a></code>
- <code><a href="./src/resources/auth.ts">AuthLogoutResponse</a></code>
- <code><a href="./src/resources/auth.ts">AuthRequestNonceResponse</a></code>

Methods:

- <code title="post /auth/logout">client.auth.<a href="./src/resources/auth.ts">logout</a>() -> AuthLogoutResponse</code>
- <code title="post /auth/nonce">client.auth.<a href="./src/resources/auth.ts">requestNonce</a>({ ...params }) -> AuthRequestNonceResponse</code>
- <code title="get /auth/me">client.auth.<a href="./src/resources/auth.ts">retrieveProfile</a>() -> UserProfile</code>
- <code title="post /auth/verify">client.auth.<a href="./src/resources/auth.ts">verifySignature</a>({ ...params }) -> UserProfile</code>

# Events

Types:

- <code><a href="./src/resources/events.ts">EventStatus</a></code>
- <code><a href="./src/resources/events.ts">EventType</a></code>
- <code><a href="./src/resources/events.ts">EventRetrieveStatusResponse</a></code>
- <code><a href="./src/resources/events.ts">EventTrackResponse</a></code>

Methods:

- <code title="get /events/{event_id}">client.events.<a href="./src/resources/events.ts">retrieveStatus</a>(eventID) -> EventRetrieveStatusResponse</code>
- <code title="post /events">client.events.<a href="./src/resources/events.ts">track</a>({ ...params }) -> EventTrackResponse</code>

# Users

Types:

- <code><a href="./src/resources/users.ts">Reward</a></code>
- <code><a href="./src/resources/users.ts">RewardType</a></code>
- <code><a href="./src/resources/users.ts">UserListBadgesResponse</a></code>
- <code><a href="./src/resources/users.ts">UserListRewardsResponse</a></code>
- <code><a href="./src/resources/users.ts">UserRetrievePointsResponse</a></code>

Methods:

- <code title="get /users/{wallet}/badges">client.users.<a href="./src/resources/users.ts">listBadges</a>(wallet) -> UserListBadgesResponse</code>
- <code title="get /users/{wallet}/rewards">client.users.<a href="./src/resources/users.ts">listRewards</a>(wallet, { ...params }) -> UserListRewardsResponse</code>
- <code title="get /users/{wallet}/points">client.users.<a href="./src/resources/users.ts">retrievePoints</a>(wallet) -> UserRetrievePointsResponse</code>
- <code title="get /users/{wallet}/profile">client.users.<a href="./src/resources/users.ts">retrieveProfile</a>(wallet) -> UserProfile</code>

# Referrals

Types:

- <code><a href="./src/resources/referrals.ts">ReferralEntry</a></code>
- <code><a href="./src/resources/referrals.ts">ReferralStatus</a></code>
- <code><a href="./src/resources/referrals.ts">ReferralRetrieveChainResponse</a></code>
- <code><a href="./src/resources/referrals.ts">ReferralRetrieveStatsResponse</a></code>
- <code><a href="./src/resources/referrals.ts">ReferralValidateCodeResponse</a></code>

Methods:

- <code title="get /referrals/{wallet}/chain">client.referrals.<a href="./src/resources/referrals.ts">retrieveChain</a>(wallet) -> ReferralRetrieveChainResponse</code>
- <code title="get /referrals/{wallet}">client.referrals.<a href="./src/resources/referrals.ts">retrieveStats</a>(wallet) -> ReferralRetrieveStatsResponse</code>
- <code title="post /referrals/validate/{code}">client.referrals.<a href="./src/resources/referrals.ts">validateCode</a>(code) -> ReferralValidateCodeResponse</code>

# Leaderboard

Types:

- <code><a href="./src/resources/leaderboard.ts">LeaderboardPeriod</a></code>
- <code><a href="./src/resources/leaderboard.ts">LeaderboardRetrieveResponse</a></code>

Methods:

- <code title="get /leaderboard">client.leaderboard.<a href="./src/resources/leaderboard.ts">retrieve</a>({ ...params }) -> LeaderboardRetrieveResponse</code>

# Apps

Types:

- <code><a href="./src/resources/apps/apps.ts">AppRetrieveResponse</a></code>
- <code><a href="./src/resources/apps/apps.ts">AppRegisterResponse</a></code>
- <code><a href="./src/resources/apps/apps.ts">AppUpdateWebhookResponse</a></code>

Methods:

- <code title="get /apps/{id}">client.apps.<a href="./src/resources/apps/apps.ts">retrieve</a>(id) -> AppRetrieveResponse</code>
- <code title="post /apps/register">client.apps.<a href="./src/resources/apps/apps.ts">register</a>({ ...params }) -> AppRegisterResponse</code>
- <code title="put /apps/{id}/webhook">client.apps.<a href="./src/resources/apps/apps.ts">updateWebhook</a>(id, { ...params }) -> AppUpdateWebhookResponse</code>

## Keys

Types:

- <code><a href="./src/resources/apps/keys.ts">KeyRotateResponse</a></code>

Methods:

- <code title="post /apps/{id}/keys/rotate">client.apps.keys.<a href="./src/resources/apps/keys.ts">rotate</a>(id) -> KeyRotateResponse</code>

# Admin

## Rules

Types:

- <code><a href="./src/resources/admin/rules.ts">RuleListResponse</a></code>
- <code><a href="./src/resources/admin/rules.ts">RuleReloadResponse</a></code>
- <code><a href="./src/resources/admin/rules.ts">RuleRetrieveStatsResponse</a></code>
- <code><a href="./src/resources/admin/rules.ts">RuleTestResponse</a></code>

Methods:

- <code title="get /admin/rules">client.admin.rules.<a href="./src/resources/admin/rules.ts">list</a>() -> RuleListResponse</code>
- <code title="post /admin/rules/reload">client.admin.rules.<a href="./src/resources/admin/rules.ts">reload</a>() -> RuleReloadResponse</code>
- <code title="get /admin/rules/{id}/stats">client.admin.rules.<a href="./src/resources/admin/rules.ts">retrieveStats</a>(id) -> RuleRetrieveStatsResponse</code>
- <code title="post /admin/rules/test">client.admin.rules.<a href="./src/resources/admin/rules.ts">test</a>({ ...params }) -> RuleTestResponse</code>
