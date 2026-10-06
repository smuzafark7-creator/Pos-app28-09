import { KOT, MenuItem } from '../../types';

export const KDS_STATIONS = ['All Stations', 'Tandoor & Grill', 'Curry', 'Chinese'] as const;

export const KDS_STATUS_OPTIONS = [
  { key: 'All', label: 'All' },
  { key: 'New', label: 'New' },
  { key: 'Preparing', label: 'Preparing' },
  { key: 'Ready', label: 'Ready' },
  { key: 'Picked Up', label: 'Picked Up' },
  { key: 'Served', label: 'Served' },
] as const;

export type KdsOrderType = 'All Types' | 'Dine In' | 'Takeaway' | 'Delivery';

export const KDS_ORDER_TYPE_OPTIONS = [
  { key: 'All Types', label: 'All Types' },
  { key: 'Dine In', label: 'Dine In' },
  { key: 'Takeaway', label: 'Takeaway' },
  { key: 'Delivery', label: 'Delivery' },
] as const;

export function matchesKdsStation(kot: KOT, station: string, menuItems: MenuItem[]): boolean {
  if (!station || station === 'All Stations') return true;

  return kot.items.some(it => {
    const mi = menuItems.find(m => m.id === it.menuItemId || m.name.toLowerCase() === it.name.toLowerCase());
    const cat = (mi?.category || '').toLowerCase();
    const itemName = it.name.toLowerCase();

    if (station === 'Tandoor & Grill') {
      return (
        cat.includes('tandoor') ||
        cat.includes('bread') ||
        cat.includes('starter') ||
        cat.includes('grill') ||
        itemName.includes('tikka') ||
        itemName.includes('kebab') ||
        itemName.includes('roti') ||
        itemName.includes('naan')
      );
    }
    if (station === 'Curry') {
      return (
        cat.includes('curry') ||
        cat.includes('main') ||
        cat.includes('biryani') ||
        cat.includes('dal') ||
        cat.includes('rice') ||
        itemName.includes('paneer') ||
        itemName.includes('masala') ||
        itemName.includes('gravy') ||
        itemName.includes('biryani')
      );
    }
    if (station === 'Chinese') {
      return (
        cat.includes('chinese') ||
        itemName.includes('manchurian') ||
        itemName.includes('noodle') ||
        itemName.includes('chilli') ||
        itemName.includes('fried rice')
      );
    }
    return true;
  });
}

export function matchesKdsStatus(kot: KOT, statusFilter: string): boolean {
  if (!statusFilter || statusFilter === 'All') {
    return ['new', 'preparing', 'ready', 'picked_up', 'served'].includes(kot.status);
  }
  if (statusFilter === 'New') return kot.status === 'new';
  if (statusFilter === 'Preparing') return kot.status === 'preparing';
  if (statusFilter === 'Ready') return kot.status === 'ready';
  if (statusFilter === 'Picked Up') return kot.status === 'picked_up';
  if (statusFilter === 'Served' || statusFilter === 'Served / Completed') return kot.status === 'served';
  return kot.status.toLowerCase() === statusFilter.toLowerCase();
}

export function matchesKdsOrderType(kot: KOT, typeFilter: string): boolean {
  if (!typeFilter || typeFilter === 'All Types') return true;

  const rawType = (kot.orderType || '').toLowerCase();

  if (typeFilter === 'Dine In') {
    if (rawType === 'dine_in') return true;
    if (kot.tableNumber && rawType !== 'takeaway' && rawType !== 'parcel' && rawType !== 'delivery') return true;
    return false;
  }

  if (typeFilter === 'Takeaway') {
    if (rawType === 'takeaway' || rawType === 'parcel') return true;
    if (!kot.tableNumber && rawType !== 'delivery' && rawType !== 'dine_in') return true;
    return false;
  }

  if (typeFilter === 'Delivery') {
    return rawType === 'delivery';
  }

  return true;
}

export function getKdsStatusCounts(
  kots: KOT[], 
  station: string = 'All Stations', 
  menuItems: MenuItem[] = [],
  orderType: string = 'All Types'
): Record<string, number> {
  const stationKots = kots.filter(
    k => k.status !== 'cancelled' && 
         matchesKdsStation(k, station, menuItems) &&
         matchesKdsOrderType(k, orderType)
  );

  const newCount = stationKots.filter(k => k.status === 'new').length;
  const preparingCount = stationKots.filter(k => k.status === 'preparing').length;
  const readyCount = stationKots.filter(k => k.status === 'ready').length;
  const pickedUpCount = stationKots.filter(k => k.status === 'picked_up').length;
  const servedCount = stationKots.filter(k => k.status === 'served').length;
  const allCount = newCount + preparingCount + readyCount + pickedUpCount + servedCount;

  return {
    All: allCount,
    New: newCount,
    Preparing: preparingCount,
    Ready: readyCount,
    'Picked Up': pickedUpCount,
    Served: servedCount,
    'Served / Completed': servedCount,
  };
}

export function getKdsTypeCounts(
  kots: KOT[], 
  station: string = 'All Stations',
  menuItems: MenuItem[] = []
): Record<string, number> {
  // Live active ticket count: tickets currently in New, Preparing, or Ready states
  const activeKots = kots.filter(
    k => (k.status === 'new' || k.status === 'preparing' || k.status === 'ready') &&
         matchesKdsStation(k, station, menuItems)
  );

  return {
    'All Types': activeKots.length,
    'Dine In': activeKots.filter(k => matchesKdsOrderType(k, 'Dine In')).length,
    'Takeaway': activeKots.filter(k => matchesKdsOrderType(k, 'Takeaway')).length,
    'Delivery': activeKots.filter(k => matchesKdsOrderType(k, 'Delivery')).length,
  };
}
