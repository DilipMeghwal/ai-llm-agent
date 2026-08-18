import { APIRequestContext, APIResponse } from '@playwright/test';
import { ENDPOINTS } from '../config/endpoints';

export class PositionsClient {
  constructor(private readonly request: APIRequestContext) {}

  async buyPosition(
    customerId: number | string,
    accountId: number | string,
    name: string,
    symbol: string,
    shares: number | string,
    pricePerShare: number | string
  ): Promise<APIResponse> {
    const params = `accountId=${accountId}&name=${encodeURIComponent(name)}&symbol=${encodeURIComponent(symbol)}&shares=${shares}&pricePerShare=${pricePerShare}`;
    return this.request.post(`${ENDPOINTS.BUY_POSITION(customerId)}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getPosition(positionId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_POSITION(positionId), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getPositionHistory(positionId: number | string, startDate: string, endDate: string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_POSITION_HISTORY(positionId, startDate, endDate), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async getCustomerPositions(customerId: number | string): Promise<APIResponse> {
    return this.request.get(ENDPOINTS.GET_CUSTOMER_POSITIONS(customerId), {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async sellPosition(
    customerId: number | string,
    accountId: number | string,
    positionId: number | string,
    shares: number | string,
    pricePerShare: number | string
  ): Promise<APIResponse> {
    const params = `accountId=${accountId}&positionId=${positionId}&shares=${shares}&pricePerShare=${pricePerShare}`;
    return this.request.post(`${ENDPOINTS.SELL_POSITION(customerId)}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }
}
