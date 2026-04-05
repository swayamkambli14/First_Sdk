// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import type { Async } from '../client';

export abstract class APIResource {
  protected _client: Async;

  constructor(client: Async) {
    this._client = client;
  }
}
