// En Firefox (MV3) el acceso a los sitios puede quedar sin otorgar al instalar: sin él no corren
// los content scripts en amazon.com. Chrome los otorga siempre al instalar.
export const ORIGINS = chrome.runtime.getManifest().host_permissions;
export const hasHostPermissions = () => chrome.permissions.contains({ origins: ORIGINS });
export const requestHostPermissions = () => chrome.permissions.request({ origins: ORIGINS });
