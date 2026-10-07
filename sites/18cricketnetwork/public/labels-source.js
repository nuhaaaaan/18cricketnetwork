import QRCode from 'qrcode';
import bwipjs from '@bwip-js/browser';
export const qrSvg=text=>QRCode.toString(text,{type:'svg',errorCorrectionLevel:'M',margin:4,width:240});
export const barcodeSvg=text=>bwipjs.toSVG({bcid:'code128',text,scale:2,height:12,includetext:true,textxalign:'center',paddingwidth:12,paddingheight:8});
