import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import './experience.css';
import '../public/drs.css';
import './guide.css';
import '../public/score-studio.css';
import '../public/score-effects.css';
export const metadata:Metadata={title:'18CricketNetwork | The next era of cricket',description:'Your cricket universe. Players, teams, matches, grounds, coaching, gear and community, connected by 18 Cricket AI.',icons:{icon:'/favicon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Script src="/launch-preview.js" strategy="afterInteractive"/></body></html>}
