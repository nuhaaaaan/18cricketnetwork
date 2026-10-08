import Script from 'next/script';
import {shell} from '../../web/shell.js';
export default function Reports(){return <><div dangerouslySetInnerHTML={{__html:shell}}/><Script src="/app.js" type="module" strategy="afterInteractive"/></>}
