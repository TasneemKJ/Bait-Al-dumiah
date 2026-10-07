// Moving a save in and out of the page: a JSON download and a bounded file read.
export const MAX_IMPORT_BYTES=512000;

export function downloadSave(state){
 const blob=new Blob([JSON.stringify(state)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`bait-al-dumiah-day-${state.day}.json`;
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// Resolves to the parsed save, or null when the file is missing, too large or not a usable save.
export async function readSaveFile(file,readSave){
 if(!file||file.size>MAX_IMPORT_BYTES)return null;
 const result=readSave(await file.text());
 return result.ok&&!result.empty?result:null;
}
