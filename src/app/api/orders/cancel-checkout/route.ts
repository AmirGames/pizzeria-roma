import { prisma } from '../../../../lib/db';
import { isSameOriginMutation } from '../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../lib/http-json';
import { realOrdersEnabled, stripeReady } from '../../../../lib/real-orders';

export async function POST(request:Request){
  if(!realOrdersEnabled()||!stripeReady())return Response.json({error:'NOT_FOUND'},{status:404});
  if(!isSameOriginMutation(request,process.env.APP_ORIGIN))return Response.json({error:'FORBIDDEN'},{status:403});
  try{
    const input=await readJson(request,1024) as {reference?:unknown};
    if(!input||typeof input!=='object'||Object.keys(input).some(key=>key!=='reference')||typeof input.reference!=='string'||!/^ROMA-[A-Z0-9]{20}$/.test(input.reference))return Response.json({error:'INVALID_REQUEST'},{status:400});
    const order=await prisma.order.findUnique({where:{publicReference:input.reference}});
    if(!order||order.paymentStatus!=='PENDING'||!order.stripeSessionId)return Response.json({ok:true});
    const response=await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(order.stripeSessionId)}/expire`,{method:'POST',headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,'Idempotency-Key':`roma-expire-${order.id}`},cache:'no-store'});
    if(!response.ok)return Response.json({error:'EXPIRY_PENDING'},{status:503});
    const session=await response.json() as {status?:string;payment_status?:string};
    if(session.status==='expired'&&session.payment_status!=='paid')await prisma.$transaction(async tx=>{
      const updated=await tx.order.updateMany({where:{id:order.id,paymentStatus:'PENDING',status:'PENDING'},data:{paymentStatus:'FAILED',status:'CANCELLED',revision:{increment:1}}});
      if(updated.count)await tx.storeCreditReservation.updateMany({where:{orderId:order.id,status:'ACTIVE'},data:{status:'RELEASED'}});
    });
    return Response.json({ok:true});
  }catch{return Response.json({error:'EXPIRY_PENDING'},{status:503});}
}
