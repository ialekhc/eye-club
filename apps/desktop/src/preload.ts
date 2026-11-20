import {
  type AllowedIpcChannel,
  isAllowedIpcChannel,
  type WorkstationDeviceIdentity,
} from './main';

export interface WorkstationBridgeApi {
  getDeviceIdentity(): Promise<WorkstationDeviceIdentity>;
  printThermalInvoice(payload: {
    invoiceNumber: string;
    centreName: string;
    patientName: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
  }): Promise<{ printed: boolean; printerName: string; timestamp: string }>;
  requestCameraConsent(patientName: string): Promise<{ granted: boolean; recordedAt: string }>;
}

/**
 * Sandboxed Preload Bridge Validator — rejects any unapproved IPC channel.
 */
export function invokeRestrictedIpc<T>(
  channel: string,
  dispatcher: (validChannel: AllowedIpcChannel, payload?: unknown) => Promise<T>,
  payload?: unknown,
): Promise<T> {
  if (!isAllowedIpcChannel(channel)) {
    throw new Error(`Security Violation: IPC channel '${channel}' is blocked by preload policy.`);
  }
  return dispatcher(channel, payload);
}
