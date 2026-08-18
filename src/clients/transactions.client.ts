import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';

export class TransactionsClient extends BaseClient {
  async getTransaction(transactionId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_TRANSACTION(transactionId));
  }

  async getAccountTransactions(accountId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_ACCOUNT_TRANSACTIONS(accountId));
  }

  async getTransactionsByAmount(accountId: number | string, amount: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_TRANSACTIONS_BY_AMOUNT(accountId, amount));
  }

  async getTransactionsByMonthAndType(accountId: number | string, month: string, type: string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_TRANSACTIONS_BY_MONTH_AND_TYPE(accountId, month, type));
  }

  async getTransactionsByDateRange(accountId: number | string, fromDate: string, toDate: string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_TRANSACTIONS_BY_DATE_RANGE(accountId, fromDate, toDate));
  }

  async getTransactionsOnDate(accountId: number | string, onDate: string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_TRANSACTIONS_ON_DATE(accountId, onDate));
  }
}
