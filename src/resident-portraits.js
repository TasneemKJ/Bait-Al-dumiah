const validIds=new Set(['lina','noor','sami']);
export function portraitMarkup(id,url){
 if(!validIds.has(id)||typeof url!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(url))return '';
 return `<span class="avatar ${id} has-portrait" aria-hidden="true"><img src="${url}" alt="" width="192" height="192" decoding="async"></span>`;
}
