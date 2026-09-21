import { useSyncExternalStore } from 'react';
import { getDemoServerState } from '../../api/demoBackend';
import { getShellSnapshot, subscribeShell } from '../../api/appShell.api';
import { getCartUnits } from '../../../features/store/model/store.rules';

export function useAppShellPresenter() {
  const state = useSyncExternalStore(subscribeShell, getShellSnapshot, getDemoServerState);
  return {
    user: state.user,
    wallet: state.wallet,
    cartUnits: getCartUnits(state.cart),
    shoppingListCount: state.shoppingList.length,
  };
}
