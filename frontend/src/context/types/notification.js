// Notification types for the application
export const NOTIFICATION_TYPES = {
  // General notification types
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  
  // Admin-specific notification types
  ADMIN_RESTAURANT_APPROVAL: 'admin_restaurant_approval',
  ADMIN_USER_PROFILE_CHANGE: 'admin_user_profile_change',
  ADMIN_PAYMENT_ISSUE: 'admin_payment_issue',
  ADMIN_SYSTEM_ALERT: 'admin_system_alert',
  ADMIN_RESTAURANT_UPDATE: 'admin_restaurant_update',
  
  // Restaurant-specific notification types
  RESTAURANT_NEW_ORDER: 'restaurant_new_order',
  RESTAURANT_ORDER_CANCELLED: 'restaurant_order_cancelled',
  RESTAURANT_PROFILE_UPDATED: 'restaurant_profile_updated',
  RESTAURANT_APPROVAL_STATUS: 'restaurant_approval_status',
  
  // User-specific notification types
  USER_ORDER_STATUS: 'user_order_status',
  USER_PAYMENT_STATUS: 'user_payment_status',
  USER_PROFILE_APPROVED: 'user_profile_approved',
  USER_SPECIAL_OFFER: 'user_special_offer',
  
  // Delivery-specific notification types
  DELIVERY_NEW_ASSIGNMENT: 'delivery_new_assignment',
  DELIVERY_ORDER_UPDATE: 'delivery_order_update',
  DELIVERY_SCHEDULE_CHANGE: 'delivery_schedule_change',
  
  // Backend system notification types (matching database values)
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  RESTAURANT_UPDATE: 'RESTAURANT_UPDATE', 
  RESTAURANT_REGISTRATION: 'RESTAURANT_REGISTRATION',
  PROFILE_UPDATE_REQUEST: 'PROFILE_UPDATE_REQUEST',
  SYSTEM: 'SYSTEM'
}; 