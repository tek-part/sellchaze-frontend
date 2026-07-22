/**
 * Platform domain layer — pure, engine-frozen-safe services that power the Multi-Theme Platform:
 * install state, storage, licensing, versioning, compatibility, validation, migration, packaging,
 * updates, installer, switcher, and the registry bridge. No React, no I/O beyond the storage port.
 */
export * from './install-state';
export * from './storage';
export * from './licensing';
export * from './versioning';
export * from './compatibility';
export * from './validator';
export * from './migration';
export * from './packaging';
export * from './updates';
export * from './installer';
export * from './switcher';
export * from './registry-bridge';
