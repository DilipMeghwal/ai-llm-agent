import { APIResponse } from '@playwright/test';
import { BaseClient } from './base.client';
import { ENDPOINTS } from '../config/endpoints';

export class PositionsClient extends BaseClient {
  async buyPosition(
    customerId: number | string,
    accountId: number | string,
    name: string,
    symbol: string,
    shares: number | string,
    pricePerShare: number | string
  ): Promise<APIResponse> {
    const params = `accountId=${accountId}&name=${encodeURIComponent(name)}&symbol=${encodeURIComponent(symbol)}&shares=${shares}&pricePerShare=${pricePerShare}`;
    return this.post(`${ENDPOINTS.BUY_POSITION(customerId)}?${params}`);
  }

  async getPosition(positionId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_POSITION(positionId));
  }

  async getPositionHistory(positionId: number | string, startDate: string, endDate: string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_POSITION_HISTORY(positionId, startDate, endDate));
  }

  async getCustomerPositions(customerId: number | string): Promise<APIResponse> {
    return this.get(ENDPOINTS.GET_CUSTOMER_POSITIONS(customerId));
  }

  async sellPosition(
    customerId: number | string,
    accountId: number | string,
    positionId: number | string,
    shares: number | string,
    pricePerShare: number | string
  ): Promise<APIResponse> {
    const params = `accountId=${accountId}&positionId=${positionId}&shares=${shares}&pricePerShare=${pricePerShare}`;
    return this.post(`${ENDPOINTS.SELL_POSITION(customerId)}?${params}`);
  }
}
