import { test as base } from '@playwright/test';
import { AccountsClient } from '../clients/accounts.client';
import { CustomersClient } from '../clients/customers.client';
import { DatabaseClient } from '../clients/database.client';
import { JmsClient } from '../clients/jms.client';
import { LoansClient } from '../clients/loans.client';
import { MiscClient } from '../clients/misc.client';
import { PositionsClient } from '../clients/positions.client';
import { TransactionsClient } from '../clients/transactions.client';

export type ApiFixtures = {
  accountsClient: AccountsClient;
  customersClient: CustomersClient;
  databaseClient: DatabaseClient;
  jmsClient: JmsClient;
  loansClient: LoansClient;
  miscClient: MiscClient;
  positionsClient: PositionsClient;
  transactionsClient: TransactionsClient;
};

export const test = base.extend<ApiFixtures>({
  accountsClient: async ({ request }, use) => {
    await use(new AccountsClient(request));
  },
  customersClient: async ({ request }, use) => {
    await use(new CustomersClient(request));
  },
  databaseClient: async ({ request }, use) => {
    await use(new DatabaseClient(request));
  },
  jmsClient: async ({ request }, use) => {
    await use(new JmsClient(request));
  },
  loansClient: async ({ request }, use) => {
    await use(new LoansClient(request));
  },
  miscClient: async ({ request }, use) => {
    await use(new MiscClient(request));
  },
  positionsClient: async ({ request }, use) => {
    await use(new PositionsClient(request));
  },
  transactionsClient: async ({ request }, use) => {
    await use(new TransactionsClient(request));
  },
});

export { expect } from '@playwright/test';
