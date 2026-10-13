import { useSyncExternalStore } from 'react';
import { appSession } from '../../api/appSession';
import { getShellSnapshot, subscribeShell } from '../../api/appShell.api';
import { getCartUnits } from '../../../features/store/model/store.rules';

export function useAppShellPresenter() {
  const state = useSyncExternalStore(
    subscribeShell,
    getShellSnapshot,
    appSession.getServerSnapshot,
  );
  return {
    ...state,
    wallet: state.shopping?.wallet ?? null,
    cartUnits: getCartUnits(state.shopping?.cart ?? []),
  };
}
