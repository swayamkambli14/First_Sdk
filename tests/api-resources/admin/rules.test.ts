// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import Async from 'async';

const client = new Async({
  apiKey: 'My API Key',
  adminSecret: 'My Admin Secret',
  baseURL: process.env["TEST_API_BASE_URL"] ?? 'http://127.0.0.1:4010',
});

describe('resource rules', () => {
  // Mock server tests are disabled
  test.skip('list', async () => {
    const responsePromise = client.admin.rules.list();
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('reload', async () => {
    const responsePromise = client.admin.rules.reload();
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('retrieveStats', async () => {
    const responsePromise = client.admin.rules.retrieveStats('first_purchase_bonus');
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('test: only required params', async () => {
    const responsePromise = client.admin.rules.test({
    mock_event: {},
    mock_user: {},
    rule_id: 'high_value_conditional',
  });
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('test: required and optional params', async () => {
    const response = await client.admin.rules.test({
    mock_event: {
    eventType: 'purchase',
    metadata: { amount: 'bar', currency: 'bar' },
  },
    mock_user: {
    currentPointsBalance: 2000,
    currentTier: 'gold',
    totalPointsEarned: 5000,
    walletAddress: '0x0000000000000000000000000000000000000001',
  },
    rule_id: 'high_value_conditional',
  });
  });
});
