// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as RulesAPI from './rules';
import { RuleListResponse, RuleReloadResponse, RuleRetrieveStatsResponse, RuleTestParams, RuleTestResponse, Rules } from './rules';

export class Admin extends APIResource {
  rules: RulesAPI.Rules = new RulesAPI.Rules(this._client);
}

Admin.Rules = Rules;

export declare namespace Admin {
  export {
    Rules as Rules,
    type RuleListResponse as RuleListResponse,
    type RuleReloadResponse as RuleReloadResponse,
    type RuleRetrieveStatsResponse as RuleRetrieveStatsResponse,
    type RuleTestResponse as RuleTestResponse,
    type RuleTestParams as RuleTestParams
  };
}
