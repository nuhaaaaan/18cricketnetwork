import { env } from 'cloudflare:workers';
import { handle } from '../../../server/api.js';
import { vercelPreview } from '../../../deployment/vercel-preview.mjs';
export const dynamic='force-dynamic';
const dispatch=async(request:Request):Promise<Response>=>{
  if(process.env.VERCEL || process.env.CRICKET_DEPLOYMENT==='vercel-preview')return vercelPreview(request);
  return await handle(request,env) || Response.json({error:'Endpoint unavailable'},{status:500});
};
export const GET=dispatch;
export const POST=dispatch;
export const PUT=dispatch;
export const DELETE=dispatch;

export const HEAD=dispatch;
