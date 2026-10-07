const rows=[['SG','SS TON','MRF','DSC','HRS'],['Shrey','GM','Moonwalkr','Kookaburra','SF Stanford'],['New Balance','Puma','ASICS','CEAT','BAS Vampire']];
export const LOGO_BRANDS=['One8',...rows.flat()];
export function brandLogo(brand){
  if(brand==='One8')return '<span class="brand-logo one8-logo"><img src="/brands/one8.svg" alt="One8" loading="lazy"></span>';
  const row=rows.findIndex(r=>r.includes(brand));if(row<0)return '';
  const col=rows[row].indexOf(brand),x=[120,415,711,1007,1304][col],y=[99,321,543][row];
  return `<span class="brand-logo"><img src="/brands/reference-logos.png" alt="${brand}" loading="lazy" style="width:562.3288%;left:${-x/292*100}%;top:${-y/216*100}%"></span>`;
}
