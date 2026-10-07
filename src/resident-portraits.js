const validIds=new Set(['lina','noor','sami']);
export function portraitMarkup(id,url){
 if(!validIds.has(id)||typeof url!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(url))return '';
 return `<span class="avatar ${id} has-portrait" aria-hidden="true"><img src="${url}" alt="" width="192" height="192" decoding="async"></span>`;
}

// A resident's face for tabs and headings: the painted portrait when ready, else a drawn stand-in.
export function avatarMarkup(id,url){
 const portrait=portraitMarkup(id,url);
 if(portrait)return portrait;
 return `<span class="avatar ${id}" aria-hidden="true"><span class="hair"></span><span
   class="face"><i></i><i></i></span><span class="dress"></span></span>`;
}
