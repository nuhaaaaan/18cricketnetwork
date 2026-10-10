// Shared, code-native cricket line icons. Labels belong to the surrounding control.
const ball='<circle cx="12" cy="12" r="8.5"/><path d="M7 4.8c7 3 3 11.4 10 14.4M5.8 6c7 3 3 11.4 10 14.4" stroke-dasharray="1.2 2"/>';
const bat='<path d="m15 3 3 2-4 6-3-2zM11 9l3 2-6 10c-.7 1-2 1.1-3 .5s-1.5-1.8-.8-2.8z"/><circle cx="19" cy="18" r="3"/><path d="m18 15.5 2 5"/>';
const wickets='<path d="M6 8v13M12 8v13M18 8v13M5 6h8M11 6h8M4 21h16"/><circle cx="19" cy="3" r="1.5"/>';
const pitch='<ellipse cx="12" cy="12" rx="10" ry="8"/><path d="M9 5h6v14H9zM8 8h8M8 16h8M11 5v2M13 5v2M11 17v2M13 17v2"/>';
const people='<circle cx="12" cy="7" r="3"/><path d="M6 21v-3a6 6 0 0 1 12 0v3M4 5a3 3 0 0 0 0 6M20 5a3 3 0 0 1 0 6M2 19v-2a4 4 0 0 1 3-4M22 19v-2a4 4 0 0 0-3-4"/>';
const trophy='<path d="M7 3h10v5a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 5 4M17 5h4v3a4 4 0 0 1-5 4M12 13v5M8 21h8M9 18h6"/>';
const scoreboard='<rect x="2" y="4" width="20" height="14" rx="2"/><path d="M5 8h5M5 12h5M14 8h5M14 12h5M12 7v8M6 21h12M8 18v3M16 18v3"/>';
const helmet='<path d="M4 13v-3a8 8 0 0 1 16 0v3M4 13h16M7 13v7h11l3-7M8 17h12M12 13v7M16 13v7"/>';
const whistle='<path d="M3 7h10l3 4h5v4h-6a6 6 0 1 1-12-8zM10 7v4h5M8 3l1-1M15 4l2-2"/><circle cx="8" cy="15" r="2"/>';
const camera='<rect x="2" y="6" width="15" height="13" rx="2"/><circle cx="9.5" cy="12.5" r="3.5"/><path d="m17 10 5-3v11l-5-3M6 6l2-3h4l2 3"/>';
const leaf='<path d="M5 18C0 8 10 2 21 3c0 11-5 19-14 17M4 22 17 8M11 14l-1-5M11 14l5 1"/>';
const chat='<path d="M21 11a8 8 0 0 1-9 8H5l-3 3v-8a9 9 0 1 1 19-3zM7 9h10M7 13h7"/>';
const gear='<path d="m9 3-1 3-3 1-2 4 2 2-1 3 3 3 3-1 2 3 4-2 1-3 3-1v-4l-3-1-1-3-3-1-1-3z"/><circle cx="11" cy="12" r="3"/>';
const bag='<path d="M4 8h16l1 13H3zM8 8V6a4 4 0 0 1 8 0v2M8 11v1M16 11v1"/>';
const car='<path d="m3 11 3-7h12l3 7v7H3zM3 11h18M6 18v3M18 18v3M6 14h2M16 14h2"/>';
const card='<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4M16 15h2"/>';
const map='<path d="m3 7 6-3 6 3 6-3v16l-6 3-6-3-6 3zM9 4v16M15 7v16"/>';
const clipboard='<path d="M8 5H5v17h14V5h-3M8 3h8v4H8zM8 11h8M8 15h5M8 19h7"/>';
const net='<path d="M3 21V3h18v18M3 8h18M3 13h18M3 18h18M8 3v18M13 3v18M18 3v18"/>';
const coach='<circle cx="8" cy="5" r="3"/><path d="M3 21v-7a5 5 0 0 1 10 0v7M8 10l8 2M17 3v5M14.5 5.5h5M17 16v5M14.5 18.5h5"/>';
const paths={home:ball,players:helmet,teams:people,matches:scoreboard,tournaments:trophy,fantasy:people+'<path d="m18 2 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',live:wickets,pickup:bat,grounds:pitch,directory:map,nets:net,academies:wickets,coaches:coach,marketplace:bag,services:whistle,repairs:'<path d="M14 3a5 5 0 0 0-6 6L3 17a3 3 0 0 0 4 4l8-7a5 5 0 0 0 6-6l-4 4-4-4z"/>',rankings:'<path d="M4 21V12h4v9M10 21V5h4v16M16 21V9h4v12M2 21h20"/>',analytics:'<path d="M3 3v18h18M6 16l4-6 4 3 6-8M16 5h4v4"/>',community:chat+'<circle cx="19" cy="18" r="3"/>',messages:chat,huddle:people,food:leaf,hardware:camera,media:camera,broadcast:camera,recruitment:bat+'<path d="M18 6h4M20 4v4"/>',riders:'<circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 5-9 5 9H5M10 8h6l3 9M8 5h4M15 5h4v3"/>',carpool:car,expenses:clipboard,paymentSetup:card,payments:card,workspace:clipboard,settings:gear,governance:whistle,drs:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M9 21h6M12 17v4M10 6v8M14 6v8M8 6h8M7 14h10"/>',feedback:whistle,about:'<path d="M3 4h7l2 2 2-2h7v16h-7l-2 2-2-2H3zM12 6v16M6 9h3M15 9h3M6 13h3M15 13h3"/>',memberships:'<circle cx="12" cy="12" r="9"/><path d="m12 6 1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z"/>',ads:'<path d="m3 10 14-6v16L3 14zM5 15l2 6h4l-2-5M20 7l2-1M20 12h2M20 17l2 1"/>',activity:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',account:helmet,search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',digital:ball+'<path d="m20 2 .7 1.3L22 4l-1.3.7L20 6l-.7-1.3L18 4l1.3-.7z"/>',refresh:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>',orders:bag,language:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18"/>',privacy:'<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 15v3"/>'};
const roleKeys={player:'players',coach:'coaches',academy:'academies',ground_owner:'grounds',practice_facility:'nets',talent_scout:'search',team_manager:'teams',tournament_organizer:'tournaments',umpire:'governance',vendor:'marketplace',restaurant:'food',service_provider:'services',fan:'community'};
export const FEATURE_ICON_KEYS=Object.keys(paths);
export function featureIcon(key){const body=Object.hasOwn(paths,key)?paths[key]:paths[roleKeys[key]]||ball;return `<svg class="feature-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;}
