import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'18CricketNetwork | The next era of cricket',description:'Your cricket universe. Players, teams, matches, grounds, coaching, gear and community, connected by 18 Cricket AI.',icons:{icon:'/favicon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
