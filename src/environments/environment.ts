// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { tick } from "@angular/core/testing";

export const environment = {
  production: false,
  urlPOSSystem:'http://localhost:8080/pos_system',//tempo
  login_path: '/api/auth/login',
  shift_active: '/api/pos/shifts/active',
  shift_open: '/api/pos/shifts/open',
  shift_close: '/api/pos/shifts/',
  search_product: '/api/pos/products/barcode/',
  checkout : '/api/pos/sales/checkout',
  ticket: '/api/pos/tickets',
  loadMetrics_admin: '/api/pos/dashboard/admin-stats',
  check_phone_wallet: '/api/pos/wallets/check',
  all_products_active: '/api/pos/products',

  urlServiceResetPassword: '/auth/reset-password',
  urlServiceUploadPhoto: '/user/upload-photo-profile',
  urlServiceSugerenciasUsuario: '/user/verificar-disponibilidad-username',
  userId:1,

  navigate_path_login: '/login',
  navigate_path_dashborad: '/dashboard'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
