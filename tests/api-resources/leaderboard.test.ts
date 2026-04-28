// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import Async from 'async';

const client = new Async({
  apiKey: 'My API Key',
  adminSecret: 'My Admin Secret',
  baseURL: process.env['TEST_API_BASE_URL'] ?? 'http://127.0.0.1:4010',
});

describe('resource leaderboard', () => {
  // Mock server tests are disabled
  test.skip('retrieve: only required params', async () => {
    const responsePromise = client.leaderboard.retrieve({ app_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e' });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('retrieve: required and optional params', async () => {
    const response = await client.leaderboard.retrieve({
      app_id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
      limit: 1,
      period: 'all_time',
    });
  });
});
