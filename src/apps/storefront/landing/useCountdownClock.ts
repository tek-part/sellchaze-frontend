import { useEffect,useMemo,useState } from 'react';
import { countdownDeadline,landingClock } from './landing-clock';
export function useCountdownClock(productId:string,sectionId:string,hours=4,endsAt?:string,preview=false){
  const end=useMemo(()=>{if(preview)return 0;let storage:Storage|undefined;try{storage=window.sessionStorage;}catch{/* blocked storage */}return countdownDeadline(productId,sectionId,hours,endsAt,Date.now(),storage);},[productId,sectionId,hours,endsAt,preview]);
  const[now,setNow]=useState(Date.now);
  useEffect(()=>{if(preview||end<=Date.now())return;const timer=window.setInterval(()=>{const next=Date.now();setNow(next);if(next>=end)window.clearInterval(timer);},1000);return()=>window.clearInterval(timer);},[end,preview]);
  return preview?landingClock(4*3600):landingClock(Math.ceil((end-Math.max(now,Date.now()))/1000));
}
