import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';
import { Payee } from '../models/types';

export class AccountsClient extends BaseClient {
  async billPay(accountId: number | string, amount: number | string, payee: Payee): Promise<APIResponse> {
    return this.post(`${ENDPOINTS.BILL_PAY}?accountId=${accountId}&amount=${amount}`, payee);
  }

  async deposit(accountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.post(`${ENDPOINTS.DEPOSIT}?accountId=${accountId}&amount=${amount}`);
  }

  async getAccount(accountId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_ACCOUNT(accountId));
  }

  async getCustomerAccounts(customerId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_CUSTOMER_ACCOUNTS(customerId));
  }

  async transfer(fromAccountId: number | string, toAccountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.post(`${ENDPOINTS.TRANSFER}?fromAccountId=${fromAccountId}&toAccountId=${toAccountId}&amount=${amount}`);
  }

  async withdraw(accountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.post(`${ENDPOINTS.WITHDRAW}?accountId=${accountId}&amount=${amount}`);
  }
}
