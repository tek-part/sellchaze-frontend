export interface LandingClock { days:number;hours:number;minutes:number;seconds:number }
export const clockUnits=['days','hours','minutes','seconds'] as const;
export const clockLabels=['أيام','ساعات','دقائق','ثواني'] as const;
export function landingClock(seconds:number):LandingClock{
  const safe=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0;
  return{days:Math.floor(safe/86400),hours:Math.floor(safe/3600)%24,minutes:Math.floor(safe/60)%60,seconds:safe%60};
}
export function validLandingClock(value:unknown):LandingClock|undefined{
  if(!value||typeof value!=='object')return undefined;
  const v=value as Record<string,unknown>;
  if(!clockUnits.every((key,index)=>typeof v[key]==='number'&&Number.isSafeInteger(v[key])&&Number(v[key])>=0&&Number(v[key])<=[100000000,23,59,59][index]!))return undefined;
  return{days:Number(v.days),hours:Number(v.hours),minutes:Number(v.minutes),seconds:Number(v.seconds)};
}
export function countdownDeadline(productId:string,sectionId:string,hours:number,endsAt:string|undefined,now:number,storage?:Pick<Storage,'getItem'|'setItem'>):number{
  if(endsAt){const end=Date.parse(endsAt);return Number.isFinite(end)?end:0;}
  const duration=Number.isFinite(hours)?Math.max(1,Math.min(720,hours)):4;
  // Reuse the existing timer key, including an already-expired deadline.
  const key=`sellchaze:landing-timer:${productId}:${sectionId}:${duration}`;
  try{const old=Number(storage?.getItem(key));if(Number.isFinite(old)&&old>0)return old;}catch{/* optional tab storage */}
  const end=now+duration*3600000;
  try{storage?.setItem(key,String(end));}catch{/* storage does not determine availability */}
  return end;
}
