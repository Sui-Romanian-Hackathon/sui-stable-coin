import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { DSC_CONFIG, getModulePath } from '../config/dsc-constants'
import { UserPosition, SupportedCoin, EMPTY_POSITION } from '../types/dsc'

/**
 * Get the user's position ID from the DSC ledger
 */
export async function getUserPositionId(
    client: SuiClient,
    userAddress: string
): Promise<string | null> {
    try {
        const tx = new Transaction()

        tx.moveCall({
            target: `${getModulePath('DSC')}::get_user_position_id`,
            arguments: [tx.object(DSC_CONFIG.DSC_LEDGER_ID)],
        })

        const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        })

        if (result.results?.[0]?.returnValues) {
            const returnValue = result.results[0].returnValues[0]
            const [data] = returnValue

            // Parse Option<ID>
            // First byte indicates Some (1) or None (0)
            if (data[0] === 1) {
                // Extract the ID (next 32 bytes)
                const idBytes = data.slice(1, 33)
                return '0x' + Buffer.from(idBytes).toString('hex')
            }
        }

        return null // User has no position
    } catch (error) {
        console.error('Error fetching user position ID:', error)
        return null
    }
}

/**
 * Get complete position information including collateral, debt, and health factor
 */
export async function getUserPositionInfo(
    client: SuiClient,
    userAddress: string,
    positionId: string
): Promise<UserPosition> {
    try {
        const tx = new Transaction()

        tx.moveCall({
            target: `${getModulePath('DSC')}::get_user_position_info`,
            arguments: [
                tx.object(positionId),
                tx.object(DSC_CONFIG.ORACLE_HOLDER_ID),
                tx.object(DSC_CONFIG.DSC_CONFIG_ID),
            ],
        })

        const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        })

        if (result.results?.[0]?.returnValues) {
            const returnValue = result.results[0].returnValues[0]
            const [data] = returnValue

            // Parse PositionInfo struct
            // This is a simplified parser - you may need to adjust based on actual BCS encoding
            const positionInfo = parsePositionInfo(data)

            return {
                id: positionId,
                ...positionInfo,
            }
        }

        return { ...EMPTY_POSITION, id: positionId }
    } catch (error) {
        console.error('Error fetching position info:', error)
        return { ...EMPTY_POSITION, id: positionId }
    }
}

/**
 * Get all supported coin types from the config
 */
export async function getSupportedCoinTypes(
    client: SuiClient,
    userAddress: string
): Promise<string[]> {
    try {
        const tx = new Transaction()

        tx.moveCall({
            target: `${getModulePath('CONFIG')}::get_supported_coin_types`,
            arguments: [tx.object(DSC_CONFIG.DSC_CONFIG_ID)],
        })

        const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        })

        console.log('getSupportedCoinTypes result:', result)

        if (result.results?.[0]?.returnValues) {
            const returnValue = result.results[0].returnValues[0]
            console.log('returnValue:', returnValue)
            const [data, type] = returnValue

            console.log('data:', data)
            console.log('type:', type)

            // Parse vector<TypeName>
            return parseCoinTypesVector(data)
        }

        return []
    } catch (error) {
        console.error('Error fetching supported coin types:', error)
        return []
    }
}

/**
 * Get coin information including price and decimals
 */
export async function getCoinInfo(
    client: SuiClient,
    userAddress: string,
    coinType: string
): Promise<SupportedCoin | null> {
    try {
        // First get the price from oracle
        const price = await getCoinPriceFromOracle(
            client,
            userAddress,
            coinType
        )

        const tx = new Transaction()

        tx.moveCall({
            target: `${getModulePath('CONFIG')}::get_coin_info`,
            typeArguments: [coinType],
            arguments: [
                tx.object(DSC_CONFIG.DSC_CONFIG_ID),
                tx.pure.u128(price),
            ],
        })

        const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        })

        if (result.results?.[0]?.returnValues) {
            const returnValue = result.results[0].returnValues[0]
            const [data] = returnValue

            const coinInfo = parseCoinInfo(data)
            return {
                coinType,
                price: coinInfo.price,
                decimals: coinInfo.decimals,
            }
        }

        return null
    } catch (error) {
        console.error(`Error fetching coin info for ${coinType}:`, error)
        return null
    }
}

/**
 * Get price from oracle for a coin type
 */
async function getCoinPriceFromOracle(
    client: SuiClient,
    userAddress: string,
    coinType: string
): Promise<string> {
    try {
        const tx = new Transaction()

        // Get TypeName for the coin
        const typeNameTx = new Transaction()
        typeNameTx.moveCall({
            target: `${getModulePath('CONFIG')}::get_type`,
            typeArguments: [coinType],
        })

        const typeNameResult = await client.devInspectTransactionBlock({
            transactionBlock: typeNameTx,
            sender: userAddress,
        })

        if (!typeNameResult.results?.[0]?.returnValues) {
            return '0'
        }

        const typeNameData = typeNameResult.results[0].returnValues[0][0]

        // Get price using the TypeName
        tx.moveCall({
            target: `${getModulePath('ORACLE')}::get_price_by_typename`,
            arguments: [
                tx.pure(bcs.vector(bcs.u8()).serialize(typeNameData)),
                tx.object(DSC_CONFIG.ORACLE_HOLDER_ID),
                tx.object(DSC_CONFIG.DSC_CONFIG_ID),
            ],
        })

        const result = await client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        })

        if (result.results?.[0]?.returnValues) {
            const [data] = result.results[0].returnValues[0]
            // Parse u128 price
            return parseU128(data).toString()
        }

        return '0'
    } catch (error) {
        console.error('Error fetching price from oracle:', error)
        return '0'
    }
}

// ==================== Parser Helper Functions ====================

function parsePositionInfo(data: number[]): Omit<UserPosition, 'id'> {
    try {
        // PositionInfo structure:
        // - coins_cache: VecMap<TypeName, CoinData>
        // - health_factor: u128
        // - debt: u128
        // - collateral_value: u128
        // - position_id: Option<ID>

        let offset = 0

        // Parse coins_cache (VecMap)
        const coinsCount = parseU64(data.slice(offset, offset + 8))
        offset += 8

        const coins = []
        for (let i = 0; i < coinsCount; i++) {
            // Parse TypeName
            const typeNameLength = parseU64(data.slice(offset, offset + 8))
            offset += 8
            const coinType = parseCoinType(
                data.slice(offset, offset + typeNameLength)
            )
            offset += typeNameLength

            // Parse CoinData (amount: u128, price: u128)
            const amount = parseU128(data.slice(offset, offset + 16)).toString()
            offset += 16
            const price = parseU128(data.slice(offset, offset + 16)).toString()
            offset += 16

            coins.push({ coinType, amount, price })
        }

        // Parse health_factor
        const healthFactor = parseU128(
            data.slice(offset, offset + 16)
        ).toString()
        offset += 16

        // Parse debt
        const debt = parseU128(data.slice(offset, offset + 16)).toString()
        offset += 16

        // Parse collateral_value
        const collateralValue = parseU128(
            data.slice(offset, offset + 16)
        ).toString()

        return {
            coins,
            healthFactor,
            debt,
            collateralValue,
        }
    } catch (error) {
        console.error('Error parsing position info:', error)
        return {
            coins: [],
            healthFactor: '0',
            debt: '0',
            collateralValue: '0',
        }
    }
}

function parseCoinTypesVector(data: number[]): string[] {
    try {
        // BCS encodes vectors as: length (u8 for small vectors) followed by elements
        // First byte is the vector length
        const length = data[0]
        console.log('Vector length:', length)
        let offset = 1

        const coinTypes: string[] = []
        for (let i = 0; i < length; i++) {
            // Each TypeName is encoded as: length (u8) followed by string bytes
            const typeNameLength = data[offset]
            console.log(`TypeName ${i} length:`, typeNameLength)
            offset += 1

            const coinType = parseCoinType(
                data.slice(offset, offset + typeNameLength)
            )
            console.log(`TypeName ${i}:`, coinType)
            offset += typeNameLength
            coinTypes.push(coinType)
        }

        return coinTypes
    } catch (error) {
        console.error('Error parsing coin types vector:', error)
        return []
    }
}

function parseCoinInfo(data: number[]): { price: string; decimals: number } {
    try {
        // CoinInfo structure:
        // - coin_type: TypeName
        // - price: u128
        // - decimals: u8

        let offset = 0

        // Skip coin_type (TypeName)
        const typeNameLength = parseU64(data.slice(offset, offset + 8))
        offset += 8 + typeNameLength

        // Parse price
        const price = parseU128(data.slice(offset, offset + 16)).toString()
        offset += 16

        // Parse decimals
        const decimals = data[offset]

        return { price, decimals }
    } catch (error) {
        console.error('Error parsing coin info:', error)
        return { price: '0', decimals: 0 }
    }
}

function parseCoinType(data: number[]): string {
    // Parse TypeName to string
    // This is simplified - actual parsing depends on BCS encoding
    try {
        return Buffer.from(data).toString('utf8')
    } catch {
        return '0x2::sui::SUI' // Fallback
    }
}

function parseU64(data: number[]): number {
    if (!data || data.length < 8) {
        return 0
    }
    let result = BigInt(0)
    for (let i = 0; i < 8; i++) {
        result |= BigInt(data[i] ?? 0) << (BigInt(i) * BigInt(8))
    }
    return Number(result)
}

function parseU128(data: number[]): bigint {
    if (!data || data.length < 16) {
        return BigInt(0)
    }
    let result = BigInt(0)
    for (let i = 0; i < 16; i++) {
        result |= BigInt(data[i] ?? 0) << (BigInt(i) * BigInt(8))
    }
    return result
}
