export function statusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case 'recording':
      return t('recording.status.recording');
    case 'requesting_permission':
      return t('recording.status.requestingPermission');
    case 'stopped':
      return t('recording.status.audioReady');
    case 'unsupported':
      return t('recording.status.notSupported');
    case 'error':
      return t('recording.status.error');
    default:
      return t('recording.status.ready');
  }
}

export function statusColor(status: string): 'default' | 'success' | 'error' | 'warning' {
  switch (status) {
    case 'recording':
      return 'warning';
    case 'stopped':
      return 'success';
    case 'unsupported':
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}
