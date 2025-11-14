import { deleteCookie, getCookie, setCookie } from 'cookies-next'

const COOKIE_NAME = 'sui_wallet_session'

export const WalletSession = {
    save(address: string) {
        setCookie(COOKIE_NAME, address, {
            maxAge: 60 * 60 * 30, //30 minutes
            sameSite: 'lax',
            secure: false,
        })
    },
    load(): string | null {
        console.log(getCookie(COOKIE_NAME) as string)
        return (getCookie(COOKIE_NAME) as string) || null
    },
    clear() {
        deleteCookie(COOKIE_NAME)
    },
}
