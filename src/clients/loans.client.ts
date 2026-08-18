import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';

export class LoansClient {
  constructor(private readonly request: APIRequestContext) {}

  async requestLoan(
    customerId: number | string,
    amount: number | string,
    downPayment: number | string,
    fromAccountId: number | string
  ): Promise<APIResponse> {
    return this.request.post(
      `${ENDPOINTS.REQUEST_LOAN}?customerId=${customerId}&amount=${amount}&downPayment=${downPayment}&fromAccountId=${fromAccountId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
  }
}
