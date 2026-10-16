import type { GalleryVariant } from './document';
export const galleryDesigns = ([4,4,4,2] as const).map((count,index)=>({id:`gallery-${index+1}` as GalleryVariant,index:index+1,count,name:`معرض الصور ${index+1}`,header:index!==3,description:index===0,sample:[[19, 67], [67, 0], [67, 0], [0, 0]][index]!,preview:([[900,818],[900,551],[900,608],[965,606]] as const)[index]!}));
export const galleryDesign=(id?:string)=>galleryDesigns.find(d=>d.id===id)??galleryDesigns[0]!;
export const galleryDefaults=(id:GalleryVariant)=>({variant:galleryDesign(id).id});
