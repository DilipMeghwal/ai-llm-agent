import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';

export class LoansClient extends BaseClient {
  async requestLoan(
    customerId: number | string,
    amount: number | string,
    downPayment: number | string,
    fromAccountId: number | string
  ): Promise<APIResponse> {
    return this.post(
      `${ENDPOINTS.REQUEST_LOAN}?customerId=${customerId}&amount=${amount}&downPayment=${downPayment}&fromAccountId=${fromAccountId}`
    );
  }
}
