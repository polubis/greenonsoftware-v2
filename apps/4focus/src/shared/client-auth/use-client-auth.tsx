import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authState, initAuthState, type ClientAuthState } from './client-auth-store';

const useClientAuth = (): ClientAuthState => {
    const state = useStore(authState);

    useEffect(() => {
        console.log("useEffect()");
        const cleanup = initAuthState();
        return () => {
            console.log("useEffect() cleanup()");
            cleanup()
        };
    }, []);

    return state;
}

export { useClientAuth };