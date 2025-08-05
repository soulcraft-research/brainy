/**
 * Version utilities for Brainy
 */

// Package version - this should be updated during the build process
const BRAINY_VERSION = '0.41.0'

/**
 * Get the current Brainy package version
 * @returns The current version string
 */
export function getBrainyVersion(): string {
  return BRAINY_VERSION
}

/**
 * Get version information for augmentation metadata
 * @param service The service/augmentation name
 * @returns Version metadata object
 */
export function getAugmentationVersion(service: string): { augmentation: string; version: string } {
  return {
    augmentation: service,
    version: getBrainyVersion()
  }
}