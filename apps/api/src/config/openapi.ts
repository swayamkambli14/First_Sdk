/**
 * Gap #11: OpenAPI documentation via @fastify/swagger.
 * Accessible at GET /docs when NODE_ENV !== 'production'.
 *
 * Install: npm install @fastify/swagger @fastify/swagger-ui
 * (already listed as optional — add to package.json if needed)
 */
export const openapiConfig = {
  openapi: {
    info: {
      title: 'ChainLoyalty API',
      description: 'Web3 loyalty infrastructure — plug-and-play blockchain rewards for any SaaS app.',
      version: '1.0.0',
    },
    servers: [{ url: 'http://localhost:3000', description: 'Local dev' }],
    components: {
      securitySchemes: {
        ApiKey: {
          type: 'http' as const,
          scheme: 'bearer',
          description: 'SaaS app API key (sk_live_...)',
        },
        JWT: {
          type: 'http' as const,
          scheme: 'bearer',
          description: 'End-user JWT obtained via SIWE flow',
        },
      },
    },
    tags: [
      { name: 'auth', description: 'SIWE wallet authentication' },
      { name: 'events', description: 'Event ingestion' },
      { name: 'rewards', description: 'User rewards, points, badges' },
      { name: 'referrals', description: 'Referral system' },
      { name: 'leaderboard', description: 'Public leaderboard' },
      { name: 'apps', description: 'App registration & management' },
      { name: 'admin', description: 'Admin — rules management' },
    ],
  },
};
