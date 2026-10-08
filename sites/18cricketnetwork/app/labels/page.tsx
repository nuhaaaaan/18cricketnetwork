import {NetworkGate} from '../network-gate';
export const dynamic='force-dynamic';
import Script from 'next/script';
export default function Labels(){return <NetworkGate><main className="labels-page"><div className="labels-toolbar"><a href="/#marketplace">18CricketNetwork ↗</a><button id="printLabels">Print reference</button></div><div id="labelsBody" role="status">Loading your label…</div><Script src="/labels.js" type="module" strategy="afterInteractive"/></main></NetworkGate>}
