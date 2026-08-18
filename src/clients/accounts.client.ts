import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';
import { Payee } from '../models/types';

export class AccountsClient {
  constructor(private readonly request: APIRequestContext) {}

  async billPay(accountId: number | string, amount: number | string, payee: Payee): Promise<APIResponse> {
    return this.request.post(`${ENDPOINTS.BILL_PAY}?accountId=${accountId}&amount=${amount}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      data: payee,
    });
  }

  async deposit(accountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.request.post(`${ENDPOINTS.DEPOSIT}?accountId=${accountId}&amount=${amount}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getAccount(accountId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_ACCOUNT(accountId), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getCustomerAccounts(customerId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_CUSTOMER_ACCOUNTS(customerId), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async transfer(fromAccountId: number | string, toAccountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.request.post(`${ENDPOINTS.TRANSFER}?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async withdraw(accountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.request.post(`${ENDPOINTS.WITHDRAW}?accountId=${accountId}&amount=${amount}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
