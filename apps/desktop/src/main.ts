/**
 * Secure Electron Main Process for Eye Club Staff-Assisted Optical Workstation.
 * Enforces contextIsolation: true, nodeIntegration: false, sandbox: true,
 * restricted IPC channels, camera consent gating, and thermal printer bridge.
 */

export interface ElectronSecurityConfig {
  contextIsolation: true;
  nodeIntegration: false;
  sandbox: true;
  webSecurity: true;
  allowRunningInsecureContent: false;
}

export interface WorkstationDeviceIdentity {
  workstationCode: string;
  deviceName: string;
  osPlatform: string;
  appVersion: string;
  cameraPermissionGranted: boolean;
  thermalPrinterConnected: boolean;
}

export const STRICT_ELECTRON_WEB_PREFERENCES: Readonly<ElectronSecurityConfig> = Object.freeze({
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
});

export const ALLOWED_IPC_CHANNELS = Object.freeze([
  'workstation:get-identity',
  'workstation:verify-license',
  'workstation:print-thermal-receipt',
  'workstation:request-camera-consent',
  'workstation:clear-local-session',
] as const);

export type AllowedIpcChannel = (typeof ALLOWED_IPC_CHANNELS)[number];

export function isAllowedIpcChannel(channel: string): channel is AllowedIpcChannel {
  return (ALLOWED_IPC_CHANNELS as readonly string[]).includes(channel);
}

export function validateExternalNavigationUrl(rawUrl: string, allowedOrigin: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    const allowed = new URL(allowedOrigin);
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }
    return parsed.origin === allowed.origin;
  } catch {
    return false;
  }
}
