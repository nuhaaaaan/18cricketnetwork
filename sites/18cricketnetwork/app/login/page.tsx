import Script from 'next/script';
import {authShell} from '../../web/auth-shell.js';
export default function Login(){return <><div dangerouslySetInnerHTML={{__html:authShell('login')}}/><Script src="/auth.js" type="module" strategy="afterInteractive"/></>}
