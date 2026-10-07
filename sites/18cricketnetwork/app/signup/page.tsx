import Script from 'next/script';
import {authShell} from '../../web/auth-shell.js';
export default function Signup(){return <><div dangerouslySetInnerHTML={{__html:authShell('signup')}}/><Script src="/auth.js" type="module" strategy="afterInteractive"/></>}
