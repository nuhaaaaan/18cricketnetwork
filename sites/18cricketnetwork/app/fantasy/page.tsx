import {NetworkGate} from '../network-gate';
import Script from 'next/script';
import {shell} from '../../web/shell.js';
export const dynamic='force-dynamic';
export default function Fantasy(){return <NetworkGate><><div dangerouslySetInnerHTML={{__html:shell}}/><Script src="/app.js" type="module" strategy="afterInteractive"/></></NetworkGate>}
