import type { OrderStatus } from '@prisma/client';
import { prisma } from '../../../../../lib/db';
import { requirePermission } from '../../../../../lib/auth';
import { isSameOriginMutation } from '../../../../../lib/catalog-management.mjs';
import { readJson } from '../../../../../lib/http-json';
import { nextRealOrderStatuses, realOrdersEnabled } from '../../../../../lib/real-orders';
import { REFERRAL_REWARD_CENTS } from '../../../../../lib/customer-referrals';

export async function PATCH(request: Request, context: { params: Promise<{id:string}> }) {
  if (!realOrdersEnabled()) return Response.json({error:'NOT_FOUND'},{status:404});
  try {
    await requirePermission('orders:update-status');
    if (!isSameOriginMutation(request,process.env.APP_ORIGIN)) return Response.json({error:'FORBIDDEN'},{status:403});
    const input=await readJson(request,1024) as {status?:string;revision?:number};
    if (!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['status','revision'].includes(k))||typeof input.status!=='string'||!Number.isSafeInteger(input.revision)) return Response.json({error:'INVALID_REQUEST'},{status:400});
    const {id}=await context.params;
    const current=await prisma.order.findUnique({where:{id}});
    if (!current||!['PAID','CREDITED'].includes(current.paymentStatus)) return Response.json({error:'NOT_FOUND'},{status:404});
    if (!nextRealOrderStatuses(current.status,current.fulfillment).includes(input.status)) return Response.json({error:'INVALID_TRANSITION'},{status:400});
    const changed=await prisma.$transaction(async tx=>{
      const result=await tx.order.updateMany({where:{id,revision:input.revision,status:current.status,paymentStatus:current.paymentStatus},data:{status:input.status as OrderStatus,revision:{increment:1}}});
      if (result.count !== 1) return false;
      if (input.status === 'COMPLETED' && current.userId) {
        const referral=await tx.referral.findUnique({where:{referredId:current.userId}});
        if (referral?.status === 'PENDING') {
          const rewarded=await tx.referral.updateMany({where:{id:referral.id,status:'PENDING'},data:{status:'REWARDED',rewardedOrderId:id,rewardedAt:new Date()}});
          if (rewarded.count === 1) await tx.storeCreditEntry.createMany({data:[
            {userId:referral.referrerId,kind:'REFERRAL_REWARD',amountCents:REFERRAL_REWARD_CENTS,note:'Parrainage récompensé après la première commande terminée'},
            {userId:referral.referredId,kind:'REFERRAL_REWARD',amountCents:REFERRAL_REWARD_CENTS,note:'Bienvenue : avoir de parrainage après votre première commande terminée'},
          ]});
        }
      }
      return true;
    });
    return Response.json({ok:changed},{status:changed?200:409});
  } catch(error) {
    const code=error instanceof Error?error.message:'';
    return Response.json({error:code==='FORBIDDEN'?'FORBIDDEN':'UNAVAILABLE'},{status:code==='FORBIDDEN'?403:503});
  }
}
