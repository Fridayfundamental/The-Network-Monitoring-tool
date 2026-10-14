import { Branch } from '../types';

export const initialBranches: Branch[] = [
  {
    id: 'lusaka-hq',
    name: 'Lusaka HQ & Retail',
    region: 'Central-South',
    x: 52,
    y: 58,
    lat: -15.4167,
    lng: 28.2833,
    status: 'online',
    latency: 8,
    uptime: 99.98,
    location: 'ASABB House, Cairo Road, Lusaka',
    lastIncident: 'None in last 72 hours',
    devices: [
      { name: 'Core Router AR-9001', status: 'online', ip: '10.211.1.1', type: 'router' },
      { name: 'Distribution Switch DS-901', status: 'online', ip: '10.211.1.2', type: 'switch' },
      { name: 'ATM Terminal #1', status: 'online', ip: '10.211.1.50', type: 'atm' },
      { name: 'ATM Terminal #2', status: 'online', ip: '10.211.1.51', type: 'atm' },
      { name: 'Smart UPS Pro 5000', status: 'online', ip: '10.211.1.100', type: 'ups' }
    ]
  },
  {
    id: 'ndola-main',
    name: 'Ndola Main Branch',
    region: 'Copperbelt',
    x: 52,
    y: 34,
    lat: -12.9667,
    lng: 28.6333,
    status: 'online',
    latency: 22,
    uptime: 99.78,
    location: 'President Avenue, Ndola',
    lastIncident: 'UPS battery test anomaly - resolved',
    devices: [
      { name: 'Branch Router AR-4011', status: 'online', ip: '10.211.2.1', type: 'router' },
      { name: 'Access Switch AS-402', status: 'online', ip: '10.211.2.2', type: 'switch' },
      { name: 'Main ATM Terminal', status: 'online', ip: '10.211.2.50', type: 'atm' },
      { name: 'Online Banking Kiosk', status: 'online', ip: '10.211.2.60', type: 'atm' },
      { name: 'Modular UPS A-300', status: 'online', ip: '10.211.2.100', type: 'ups' }
    ]
  },
  {
    id: 'kitwe-retail',
    name: 'Kitwe Retail Centre',
    region: 'Copperbelt',
    x: 48,
    y: 32,
    lat: -12.8000,
    lng: 28.2000,
    status: 'online',
    latency: 24,
    uptime: 99.85,
    location: 'Obote Avenue, Kitwe',
    lastIncident: 'Fiber switchover - degraded 1h',
    devices: [
      { name: 'Branch Router AR-4012', status: 'online', ip: '10.211.3.1', type: 'router' },
      { name: 'Access Switch AS-403', status: 'online', ip: '10.211.3.2', type: 'switch' },
      { name: 'Kitwe ATM Drive-Thru', status: 'online', ip: '10.211.3.50', type: 'atm' },
      { name: 'Online Banking Kiosk', status: 'online', ip: '10.211.3.60', type: 'atm' },
      { name: 'Smart UPS Pro 3000', status: 'online', ip: '10.211.3.100', type: 'ups' }
    ]
  },
  {
    id: 'livingstone',
    name: 'Livingstone Hub',
    region: 'Southern',
    x: 35,
    y: 85,
    lat: -17.8500,
    lng: 25.8500,
    status: 'online',
    latency: 28,
    uptime: 99.64,
    location: 'Mosi-O-Tunya Road, Livingstone',
    lastIncident: 'Power grid oscillation - UPS activated',
    devices: [
      { name: 'Branch Router AR-3015', status: 'online', ip: '10.211.4.1', type: 'router' },
      { name: 'Access Switch AS-302', status: 'online', ip: '10.211.4.2', type: 'switch' },
      { name: 'Falls Resort ATM #1', status: 'online', ip: '10.211.4.50', type: 'atm' },
      { name: 'Branch ATM #2', status: 'online', ip: '10.211.4.51', type: 'atm' },
      { name: 'Critical UPS Powerhouse', status: 'online', ip: '10.211.4.100', type: 'ups' }
    ]
  },
  {
    id: 'kabwe-corp',
    name: 'Kabwe Commercial',
    region: 'Central',
    x: 51,
    y: 48,
    lat: -14.4333,
    lng: 28.4500,
    status: 'online',
    latency: 14,
    uptime: 99.91,
    location: 'Independence Way, Kabwe',
    lastIncident: 'None in last 7 days',
    devices: [
      { name: 'Branch Router AR-3011', status: 'online', ip: '10.211.5.1', type: 'router' },
      { name: 'Access Switch AS-301', status: 'online', ip: '10.211.5.2', type: 'switch' },
      { name: 'Kabwe Main ATM', status: 'online', ip: '10.211.5.50', type: 'atm' },
      { name: 'Smart UPS Pro 3000', status: 'online', ip: '10.211.5.100', type: 'ups' }
    ]
  },
  {
    id: 'chipata-border',
    name: 'Chipata Gateway',
    region: 'Eastern',
    x: 85,
    y: 46,
    lat: -13.6333,
    lng: 32.6500,
    status: 'online',
    latency: 35,
    uptime: 99.52,
    location: 'Umodzi Highway, Chipata',
    lastIncident: 'Secondary link failover - completed',
    devices: [
      { name: 'Branch Router AR-3012', status: 'online', ip: '10.211.6.1', type: 'router' },
      { name: 'Access Switch AS-303', status: 'online', ip: '10.211.6.2', type: 'switch' },
      { name: 'Border ATM Terminal', status: 'online', ip: '10.211.6.50', type: 'atm' },
      { name: 'Smart UPS Pro 3000', status: 'online', ip: '10.211.6.100', type: 'ups' }
    ]
  },
  {
    id: 'solwezi-mine',
    name: 'Solwezi Mining Hub',
    region: 'North-Western',
    x: 35,
    y: 25,
    lat: -12.1833,
    lng: 26.4000,
    status: 'online',
    latency: 42,
    uptime: 99.41,
    location: 'Kansanshi Mine Road, Solwezi',
    lastIncident: 'Mine power surge damaged switch - replaced',
    devices: [
      { name: 'Branch Router AR-5011', status: 'online', ip: '10.211.7.1', type: 'router' },
      { name: 'Access Switch AS-502', status: 'online', ip: '10.211.7.2', type: 'switch' },
      { name: 'Solwezi Centre ATM', status: 'online', ip: '10.211.7.50', type: 'atm' },
      { name: 'Kansanshi Site ATM', status: 'online', ip: '10.211.7.51', type: 'atm' },
      { name: 'Industrial UPS 10kVA', status: 'online', ip: '10.211.7.100', type: 'ups' }
    ]
  },
  {
    id: 'kasama-agency',
    name: 'Kasama Regional',
    region: 'Northern',
    x: 75,
    y: 18,
    lat: -10.2122,
    lng: 31.1808,
    status: 'online',
    latency: 38,
    uptime: 99.35,
    location: 'Mubanga Chipoya Road, Kasama',
    lastIncident: 'Satellite backup latency high - warning status',
    devices: [
      { name: 'Branch Router AR-3013', status: 'online', ip: '10.211.8.1', type: 'router' },
      { name: 'Access Switch AS-304', status: 'online', ip: '10.211.8.2', type: 'switch' },
      { name: 'Kasama Market ATM', status: 'online', ip: '10.211.8.50', type: 'atm' },
      { name: 'Smart UPS Pro 3000', status: 'online', ip: '10.211.8.100', type: 'ups' }
    ]
  }
];

export const initialAlerts = [
  {
    id: 'alt-101',
    timestamp: new Date(Date.now() - 3600000 * 4).toLocaleTimeString(), // 4h ago
    branchId: 'solwezi-mine',
    branchName: 'Solwezi Mining Hub',
    device: 'Industrial UPS 10kVA',
    severity: 'WARNING' as const,
    description: 'UPS Temperature threshold exceeded: 41°C',
    status: 'resolved' as const
  },
  {
    id: 'alt-102',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toLocaleTimeString(), // 2.5h ago
    branchId: 'livingstone',
    branchName: 'Livingstone Hub',
    device: 'Falls Resort ATM #1',
    severity: 'WARNING' as const,
    description: 'ATM Safe door open alert sensor triggered',
    status: 'resolved' as const
  },
  {
    id: 'alt-103',
    timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), // 30 mins ago
    branchId: 'chipata-border',
    branchName: 'Chipata Gateway',
    device: 'Branch Router AR-3012',
    severity: 'INFO' as const,
    description: 'ISP Primary link packet loss threshold breached (2.1%)',
    status: 'resolved' as const
  }
];
