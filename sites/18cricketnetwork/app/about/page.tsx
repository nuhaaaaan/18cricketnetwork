import {NetworkGate} from '../network-gate';
export const dynamic='force-dynamic';
import Script from 'next/script';
import {shell} from '../../web/shell.js';
export default function About(){return <NetworkGate><><div dangerouslySetInnerHTML={{__html:shell}}/><Script src="/app.js" type="module" strategy="afterInteractive"/></></NetworkGate>}
