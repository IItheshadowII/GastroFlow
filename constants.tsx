
import { PlanDetails, PlanTier } from './types';

export const PERMISSION_GROUPS = [
  {
    name: 'Operaciones de Salón',
    icon: 'layout',
    permissions: [
      { id: 'tables.view', label: 'Ver Plano de Mesas', description: 'Permite visualizar el estado de las mesas.' },
      { id: 'tables.edit', label: 'Gestionar Comandas', description: 'Abrir cuentas, añadir items y procesar pagos.' },
      { id: 'tables.manage', label: 'Configurar Mesas', description: 'Crear, editar o eliminar mesas y zonas.' },
      { id: 'kitchen.view', label: 'Monitor de Cocina', description: 'Acceso a la pantalla de preparación de pedidos.' },
      { id: 'kitchen.manage', label: 'Control de Producción', description: 'Marcar items como listos o entregados.' },
    ]
  },
  {
    name: 'Caja y Finanzas',
    icon: 'wallet',
    permissions: [
      { id: 'cash.view', label: 'Ver Historial de Cierres', description: 'Consultar turnos pasados y balances.' },
      { id: 'cash.manage', label: 'Operar Caja', description: 'Abrir y cerrar turnos, declarar efectivo.' },
      { id: 'dashboard.view', label: 'Ver Dashboard Principal', description: 'Acceso a métricas rápidas de hoy.' },
      { id: 'reports.view', label: 'Reportes Avanzados', description: 'Acceso a informes diarios, semanales y mensuales detallados.' },
    ]
  },
  {
    name: 'Catálogo e Inventario',
    icon: 'package',
    permissions: [
      { id: 'menu.view', label: 'Ver Catálogo', description: 'Visualizar productos y precios.' },
      { id: 'menu.edit', label: 'Gestionar Productos', description: 'Crear, editar y organizar la carta.' },
      { id: 'stock.view', label: 'Ver Existencias', description: 'Acceso al módulo de inventario.' },
      { id: 'stock.adjust', label: 'Ajustar Stock', description: 'Permite realizar ajustes manuales o por IA.' },
    ]
  },
  {
    name: 'Configuración y SaaS',
    icon: 'settings',
    permissions: [
      { id: 'users.view', label: 'Ver Equipo', description: 'Ver lista de usuarios y sus estados.' },
      { id: 'users.manage', label: 'Gestionar Personal', description: 'Invitar, editar o dar de baja usuarios.' },
      { id: 'roles.manage', label: 'Control de Roles', description: 'Crear y editar permisos de los roles.' },
      { id: 'settings.manage', label: 'Configuración', description: 'Ajustes del local (no incluye IA global).' },
      { id: 'billing.manage', label: 'Gestión de Suscripción', description: 'Acceso a pagos y cambio de plan.' },
    ]
  }
];

export const PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions);

export const PLANS: Record<PlanTier, PlanDetails> = {
  [PlanTier.BASIC]: {
    id: PlanTier.BASIC,
    name: 'Básico',
    price: 4900,
    features: ['1 Solo Usuario', 'Hasta 10 mesas', 'Gestión de menú básico', 'Soporte por email'],
    limits: { users: 1, tables: 10, products: 50 }
  },
  [PlanTier.PRO]: {
    id: PlanTier.PRO,
    name: 'Pro',
    price: 9900,
    features: ['Hasta 3 Usuarios', 'Hasta 50 mesas', 'Gestión de stock avanzada', 'Dashboard de ventas', 'Soporte prioritario'],
    limits: { users: 3, tables: 50, products: 200 }
  },
  [PlanTier.ENTERPRISE]: {
    id: PlanTier.ENTERPRISE,
    name: 'Enterprise',
    price: 19900,
    features: ['Usuarios Ilimitados', 'Mesas ilimitadas', 'Multi-sucursal', 'API Access', 'Account Manager Dedicado'],
    limits: { users: 9999, tables: 9999, products: 9999 }
  }
};
