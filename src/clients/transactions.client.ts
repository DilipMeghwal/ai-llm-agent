import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';

export class TransactionsClient {
  constructor(private readonly request: APIRequestContext) {}

  async getTransaction(transactionId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_TRANSACTION(transactionId), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getAccountTransactions(accountId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_ACCOUNT_TRANSACTIONS(accountId), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getTransactionsByAmount(accountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_TRANSACTIONS_BY_AMOUNT(accountId, amount), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getTransactionsByMonthAndType(accountId: number | string, month: string, type: string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_TRANSACTIONS_BY_MONTH_AND_TYPE(accountId, month, type), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getTransactionsByDateRange(accountId: number | string, fromDate: string, toDate: string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_TRANSACTIONS_BY_DATE_RANGE(accountId, fromDate, toDate), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getTransactionsOnDate(accountId: number | string, onDate: string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_TRANSACTIONS_ON_DATE(accountId, onDate), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
