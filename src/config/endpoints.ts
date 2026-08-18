/**
 * Route Registry
 * Centralized registry of API endpoints for ParaBank REST API.
 * Paths are relative to base server URL ending with /
 */

export const ENDPOINTS = {
  // Accounts
  BILL_PAY: 'billpay',
  DEPOSIT: 'deposit',
  GET_ACCOUNT: (accountId: number | string) => `accounts/${accountId}`,
  GET_CUSTOMER_ACCOUNTS: (customerId: number | string) => `customers/${customerId}/accounts`,
  TRANSFER: 'transfer',
  WITHDRAW: 'withdraw',

  // Customers
  CREATE_ACCOUNT: 'createAccount',
  GET_CUSTOMER: (customerId: number | string) => `customers/${customerId}`,
  UPDATE_CUSTOMER: (customerId: number | string) => `customers/update/${customerId}`,

  // Database
  CLEAN_DB: 'cleanDB',
  INITIALIZE_DB: 'initializeDB',

  // JMS
  SHUTDOWN_JMS: 'shutdownJmsListener',
  STARTUP_JMS: 'startupJmsListener',

  // Loans
  REQUEST_LOAN: 'requestLoan',

  // Misc
  LOGIN: (username: string, password: string) => `login/${encodeURIComponent(username)}/${encodeURIComponent(password)}`,
  SET_PARAMETER: (name: string, value: string) => `setParameter/${encodeURIComponent(name)}/${encodeURIComponent(value)}`,

  // Positions
  BUY_POSITION: (customerId: number | string) => `customers/${customerId}/buyPosition`,
  GET_POSITION: (positionId: number | string) => `positions/${positionId}`,
  GET_POSITION_HISTORY: (positionId: number | string, startDate: string, endDate: string) =>
    `positions/${positionId}/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`,
  GET_CUSTOMER_POSITIONS: (customerId: number | string) => `customers/${customerId}/positions`,
  SELL_POSITION: (customerId: number | string) => `customers/${customerId}/sellPosition`,

  // Transactions
  GET_TRANSACTION: (transactionId: number | string) => `transactions/${transactionId}`,
  GET_ACCOUNT_TRANSACTIONS: (accountId: number | string) => `accounts/${accountId}/transactions`,
  GET_TRANSACTIONS_BY_AMOUNT: (accountId: number | string, amount: number | string) =>
    `accounts/${accountId}/transactions/amount/${amount}`,
  GET_TRANSACTIONS_BY_MONTH_AND_TYPE: (accountId: number | string, month: string, type: string) =>
    `accounts/${accountId}/transactions/month/${encodeURIComponent(month)}/type/${encodeURIComponent(type)}`,
  GET_TRANSACTIONS_BY_DATE_RANGE: (accountId: number | string, fromDate: string, toDate: string) =>
    `accounts/${accountId}/transactions/fromDate/${encodeURIComponent(fromDate)}/toDate/${encodeURIComponent(toDate)}`,
  GET_TRANSACTIONS_ON_DATE: (accountId: number | string, onDate: string) =>
    `accounts/${accountId}/transactions/onDate/${encodeURIComponent(onDate)}`,
} as const;
