import {NetworkGate} from '../network-gate';
export const dynamic='force-dynamic';
import Script from 'next/script';
export default function Display(){return <NetworkGate><main className="led-display"><div id="displayConnection" role="status">Connecting to match scoreboard…</div><div id="ledScore"/><footer><a href="/#matches">18CricketNetwork ↗</a><span id="lastUpdated"/><button id="ledFullscreen">Fullscreen</button></footer><Script src="/broadcast-display.js" type="module" strategy="afterInteractive"/></main></NetworkGate>}
