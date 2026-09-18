export interface NotificationTestResult {
  success: boolean;
  message: string;
  latencyMs: number;
}

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface INotificationProvider {
  test(config: any): Promise<NotificationTestResult>;
  send(config: any, event: string, payload: any): Promise<NotificationSendResult>;
}
