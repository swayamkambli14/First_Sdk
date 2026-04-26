// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import Async from 'async';

const client = new Async({
  apiKey: 'My API Key',
  adminSecret: 'My Admin Secret',
  baseURL: process.env["TEST_API_BASE_URL"] ?? 'http://127.0.0.1:4010',
});

describe('resource users', () => {
  // Mock server tests are disabled
  test.skip('listBadges', async () => {
    const responsePromise = client.users.listBadges('0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b');
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('listRewards', async () => {
    const responsePromise = client.users.listRewards('0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b');
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('listRewards: request options and params are passed correctly', async () => {
    // ensure the request options are being passed correctly by passing an invalid HTTP method in order to cause an error
    await expect(client.users.listRewards('0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', { limit: 1, offset: 0 }, { path: '/_stainless_unknown_path' }))
      .rejects
      .toThrow(Async.NotFoundError);
  });

  // Mock server tests are disabled
  test.skip('retrievePoints', async () => {
    const responsePromise = client.users.retrievePoints('0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b');
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });

  // Mock server tests are disabled
  test.skip('retrieveProfile', async () => {
    const responsePromise = client.users.retrieveProfile('0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b');
    const rawResponse = await responsePromise.asResponse();
    expect(rawResponse).toBeInstanceOf(Response);
    const response = await responsePromise;
    expect(response).not.toBeInstanceOf(Response);
    const dataAndResponse = await responsePromise.withResponse();
    expect(dataAndResponse.data).toBe(response);
    expect(dataAndResponse.response).toBe(rawResponse);
  });
});
