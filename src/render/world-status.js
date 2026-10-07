// A plain snapshot of the scene for browser checks (exposed only under ?debug=1).
export function visualStatus(w){
 const {st,roomEffects,portraitCache,presentation,cameraMove,preview,house,decorSync,
   restoration,objects,storyProps,teaTable,sewingPlay,moonChimes,
   courtyard,picking}=w;
 const stitchGuidePositions=picking.stitchGuidePositions;
 return {atmosphereFx:roomEffects.status(),portraitCount:portraitCache.size,
   quality:st.quality,focusedRoom:st.focusedRoom,focusedDoll:st.focusedDoll,
    presentation:presentation.value,nightMix:st.nightMix,cameraMoving:cameraMove.active,
      previewVisible:preview.root.visible,previewValid:preview.root.userData.valid??
    false,windowMaterials:house.windows.size,
      activeOwnedLights:[...decorSync.items.values()].filter(o=>o.userData.ownedLight?.intensity>0).length,
    restoredLights:restoration.lights.filter(l=>l.intensity>0).length,
      reactivePoses:Object.fromEntries([...decorSync.items].map(([id,o])=>[id,
    {turn:o.rotation.y,rock:o.rotation.z,scale:o.scale.x}])),
      courtyard:house.root.getObjectByName('levantine-courtyard')?.userData.nightCue,
    selectedObject:objects.selected,story:storyProps.status(),teaActive:st.teaActive,tea:teaTable.status(),
      stitchActive:st.stitchActive,workCeilingVisible:house.workCeiling.visible,
    workArchVisible:courtyard.studioArch.visible,stitch:sewingPlay.status(),
      stitchGuides:stitchGuidePositions(),chimeActive:st.chimeActive,chimes:moonChimes.status()};
}
