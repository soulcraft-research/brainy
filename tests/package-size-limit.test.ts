/**
 * Package Size Limit Tests
 * Tests the predicted npm package size to ensure it stays within acceptable limits
 */

import {describe, expect, it} from 'vitest'
import {execSync} from 'child_process'

const CURRENT_UNPACKED_SIZE_MB = 2.5
const CURRENT_PACKED_SIZE_MB = 0.65
const ALLOWED_SIZE_INCREASE_PERCENTAGE = 10 // 10% increase threshold

/**
 * Parses npm pack --dry-run output to extract package size information
 */
function parseNpmPackOutput(output: string): {
    packedSizeMB: number
    unpackedSizeMB: number
    totalFiles: number
} {
    const packageSizeMatch = output.match(
        /npm notice package size:\s*([\d.]+)\s*([KMGTkmgt]?B)/
    )
    const unpackedSizeMatch = output.match(
        /npm notice unpacked size:\s*([\d.]+)\s*([KMGTkmgt]?B)/
    )
    const totalFilesMatch = output.match(/npm notice total files:\s*(\d+)/)

    const convertToMB = (size: number, unit: string): number => {
        switch (unit.toUpperCase()) {
            case 'B':
                return size / (1024 * 1024)
            case 'KB':
                return size / 1024
            case 'MB':
                return size
            case 'GB':
                return size * 1024
            default:
                return size / (1024 * 1024) // assume bytes
        }
    }

    const packedSizeMB = packageSizeMatch
        ? convertToMB(parseFloat(packageSizeMatch[1]), packageSizeMatch[2])
        : 0

    const unpackedSizeMB = unpackedSizeMatch
        ? convertToMB(parseFloat(unpackedSizeMatch[1]), unpackedSizeMatch[2])
        : 0

    const totalFiles = totalFilesMatch ? parseInt(totalFilesMatch[1], 10) : 0

    return {packedSizeMB, unpackedSizeMB, totalFiles}
}

/**
 * Cached npm package size result to avoid multiple expensive npm pack calls
 */
let cachedPackageSize: {
    packedSizeMB: number
    unpackedSizeMB: number
    totalFiles: number
} | null = null

/**
 * Gets the predicted npm package size using npm pack --dry-run
 * Results are cached to avoid multiple expensive executions
 */
async function getNpmPackageSize(): Promise<{
    packedSizeMB: number
    unpackedSizeMB: number
    totalFiles: number
}> {
    // Return cached result if available
    if (cachedPackageSize) {
        return cachedPackageSize
    }

    try {
        // Use 2>&1 to capture both stdout and stderr in one command
        const output = execSync('npm pack --dry-run 2>&1', {
            encoding: 'utf8',
            cwd: process.cwd(),
            timeout: 45000 // 45 second timeout to prevent hanging
        })

        const result = parseNpmPackOutput(output)

        // Cache the result for subsequent calls
        cachedPackageSize = result

        return result
    } catch (error) {
        throw new Error(`Failed to get npm package size: ${error}`)
    }
}

describe('Package Size Limits', () => {
    it('should not exceed unpacked size threshold for npm package', async () => {
        const {unpackedSizeMB} = await getNpmPackageSize()
        const maxAllowedSize =
            CURRENT_UNPACKED_SIZE_MB * (1 + ALLOWED_SIZE_INCREASE_PERCENTAGE / 100)

        console.log(`Current unpacked package size: ${unpackedSizeMB.toFixed(2)}MB`)
        console.log(`Maximum allowed unpacked size: ${maxAllowedSize.toFixed(2)}MB`)

        expect(
            unpackedSizeMB,
            `Unpacked package size (${unpackedSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxAllowedSize.toFixed(2)}MB)`
        ).toBeLessThanOrEqual(maxAllowedSize)
    })

    it('should not exceed packed size threshold for npm package', async () => {
        const {packedSizeMB} = await getNpmPackageSize()
        const maxAllowedSize =
            CURRENT_PACKED_SIZE_MB * (1 + ALLOWED_SIZE_INCREASE_PERCENTAGE / 100)

        console.log(`Current packed package size: ${packedSizeMB.toFixed(2)}MB`)
        console.log(`Maximum allowed packed size: ${maxAllowedSize.toFixed(2)}MB`)

        expect(
            packedSizeMB,
            `Packed package size (${packedSizeMB.toFixed(2)}MB) exceeds maximum allowed size (${maxAllowedSize.toFixed(2)}MB)`
        ).toBeLessThanOrEqual(maxAllowedSize)
    })

    it('should report package composition details', async () => {
        const {packedSizeMB, unpackedSizeMB, totalFiles} =
            await getNpmPackageSize()

        console.log(`\nPackage composition:`)
        console.log(`- Total files: ${totalFiles}`)
        console.log(`- Packed size: ${packedSizeMB.toFixed(2)}MB`)
        console.log(`- Unpacked size: ${unpackedSizeMB.toFixed(2)}MB`)
        console.log(
            `- Compression ratio: ${((1 - packedSizeMB / unpackedSizeMB) * 100).toFixed(1)}%`
        )

        // Basic sanity checks
        expect(totalFiles).toBeGreaterThan(0)
        expect(packedSizeMB).toBeGreaterThan(0)
        expect(unpackedSizeMB).toBeGreaterThan(0)
        expect(packedSizeMB).toBeLessThan(unpackedSizeMB)
    })
})
