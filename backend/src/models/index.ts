import { sequelize } from '../config/sequelize';
import { Role } from './role.model';
import { User } from './user.model';
import { ProviderProfile } from './provider-profile.model';
import { ProviderAvailability } from './provider-availability.model';
import { Category } from './category.model';
import { Service } from './service.model';
import { Booking } from './booking.model';
import { Payment } from './payment.model';
import { Notification } from './notification.model';

// roles 1:N users
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// users 1:1 provider_profiles
User.hasOne(ProviderProfile, {
  foreignKey: 'user_id',
  as: 'providerProfile',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ProviderProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// users 1:N provider_availability
User.hasMany(ProviderAvailability, {
  foreignKey: 'provider_id',
  as: 'availability',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
ProviderAvailability.belongsTo(User, { foreignKey: 'provider_id', as: 'provider' });

// categories 1:N services
Category.hasMany(Service, {
  foreignKey: 'category_id',
  as: 'services',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Service.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// users (customer) 1:N bookings
User.hasMany(Booking, {
  foreignKey: 'customer_id',
  as: 'customerBookings',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Booking.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

// users (provider) 1:N bookings (optional)
User.hasMany(Booking, {
  foreignKey: 'provider_id',
  as: 'providerBookings',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Booking.belongsTo(User, { foreignKey: 'provider_id', as: 'provider' });

// services 1:N bookings
Service.hasMany(Booking, {
  foreignKey: 'service_id',
  as: 'bookings',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Booking.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// bookings 1:1 payments
Booking.hasOne(Payment, {
  foreignKey: 'booking_id',
  as: 'payment',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// users 1:N notifications
User.hasMany(Notification, {
  foreignKey: 'user_id',
  as: 'notifications',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// bookings 1:N notifications (optional)
Booking.hasMany(Notification, {
  foreignKey: 'booking_id',
  as: 'notifications',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Notification.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

export {
  sequelize,
  Role,
  User,
  ProviderProfile,
  ProviderAvailability,
  Category,
  Service,
  Booking,
  Payment,
  Notification,
};
