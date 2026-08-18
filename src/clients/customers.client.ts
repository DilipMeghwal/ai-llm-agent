import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';
import { UpdateCustomerParams } from '../models/types';

export class CustomersClient extends BaseClient {
  async createAccount(customerId: number | string, newAccountType: number | string, fromAccountId: number | string): Promise<APIResponse> {
    return this.post(
      `${ENDPOINTS.CREATE_ACCOUNT}?customerId=${customerId}&newAccountType=${newAccountType}&fromAccountId=${fromAccountId}`
    );
  }

  async getCustomer(customerId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_CUSTOMER(customerId));
  }

  async updateCustomer(params: UpdateCustomerParams): Promise<APIResponse> {
    const queryParams = new URLSearchParams({
      firstName: params.firstName,
      lastName: params.lastName,
      street: params.street,
      city: params.city,
      state: params.state,
      zipCode: params.zipCode,
      phoneNumber: params.phoneNumber,
      ssn: params.ssn,
      username: params.username,
      password: params.password,
    }).toString();

    return this.post(`${ENDPOINTS.UPDATE_CUSTOMER(params.customerId)}?${queryParams}`);
  }
}
