import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';
import { UpdateCustomerParams } from '../models/types';

export class CustomersClient {
  constructor(private readonly request: APIRequestContext) {}

  async createAccount(customerId: number | string, newAccountType: number | string, fromAccountId: number | string): Promise<APIResponse> {
    return this.request.post(
      `${ENDPOINTS.CREATE_ACCOUNT}?customerId=${customerId}&newAccountType=${newAccountType}&fromAccountId=${fromAccountId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
  }

  async getCustomer(customerId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_CUSTOMER(customerId), {
      headers: {
        'Accept': 'application/json',
      },
    });
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

    return this.request.post(`${ENDPOINTS.UPDATE_CUSTOMER(params.customerId)}?${queryParams}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
