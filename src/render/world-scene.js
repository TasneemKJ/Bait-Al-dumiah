import {createLevantineSetting} from './levantine-setting.js';
import * as T from 'three';
import {renderPortrait,createPortraitCache} from './doll-portraits.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createDecorSync,createSlotMarkers} from './decor-sync.js';
import {createHouse} from './house.js';
import {createDolls,createGhost} from './dolls.js';
import {createCraftDetails,createGarden} from './ornaments.js';
import {createKeepsakeDetails} from './keepsake-details.js';
import {createPlacementPreview} from './placement-preview.js';
import {createRoomFrame} from './room-frame.js';
import {createRoomEffects} from './room-effects.js';
import {createObjectInteractions} from './object-interactions.js';
import {createStoryProps} from './story-props.js';
import {createTeaTable} from './tea-table.js';
import {createSewingPlay} from './sewing-play.js';
import {createMoonChimes} from './moon-chimes.js';
import {createRestoration} from './restoration.js';
import {createAtmosphere} from './atmosphere.js';

// Builds the Three.js scene graph: renderer, camera, controls, lights, house, residents and every prop layer.
export function buildScene(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(), camera=new T.OrthographicCamera(-10,10,6,-6,.1,100);
 const depthFog=new T.FogExp2(0xe7d8c8,.0012);scene.fog=depthFog;
 const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.10;
 controls.minAzimuthAngle=-.48;controls.maxAzimuthAngle=.48;controls.minPolarAngle=1.10;controls.maxPolarAngle=1.50;controls.minZoom=.8;controls.maxZoom=3.5;
 controls.touches.ONE=T.TOUCH.ROTATE;controls.touches.TWO=T.TOUCH.DOLLY_ROTATE;
 const hemi=new T.HemisphereLight(0xffecde,0x816a7b,2.3);scene.add(hemi);
 const key=new T.DirectionalLight(0xffeddb,3.5);key.position.set(-5,11,10);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
 Object.assign(key.shadow.camera,{left:-9,right:9,top:12,bottom:-5,near:1,far:35});key.shadow.normalBias=.035;key.shadow.bias=-.0003;scene.add(key);
 const fill=new T.DirectionalLight(0xbfbadb,1.8);fill.position.set(7,6,-6);scene.add(fill);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.15}));floor.rotation.x=-Math.PI/2;
 floor.position.y=-.70;floor.receiveShadow=true;scene.add(floor);
 const house=createHouse(scene), residents=createDolls(house.root),ghost=createGhost(house.root);
 const courtyard=createLevantineSetting(house.root);
 const portraitCache=createPortraitCache(residents,doll=>renderPortrait(renderer,doll));
 createKeepsakeDetails(house.root);const details=createCraftDetails(house.root);createGarden(house.root);
 const atmosphere=createAtmosphere(scene),roomEffects=createRoomEffects(house.root),roomFrame=createRoomFrame(house.root),
   preview=createPlacementPreview(house.root);
 const restoration=createRestoration(house.root),objects=createObjectInteractions(house.root),storyProps=createStoryProps(house.root),
   teaTable=createTeaTable(house.root),sewingPlay=createSewingPlay(house.root),moonChimes=createMoonChimes(house.root);
 const decorSync=createDecorSync(house.root),slots=createSlotMarkers(house.root);
 return {renderer,scene,camera,depthFog,controls,hemi,key,fill,house,residents,ghost,courtyard,portraitCache,details,atmosphere,
   roomEffects,roomFrame,preview,restoration,objects,storyProps,teaTable,sewingPlay,moonChimes,decorSync,slots};
}

// Frees every geometry, material and map in the scene (the renderer itself is disposed by the caller).
export function disposeScene(scene){
 const geos=new Set(),mats=new Set();
 scene.traverse(o=>{
  if(o.geometry)geos.add(o.geometry);
  if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);
 });
 geos.forEach(g=>g.dispose());
 mats.forEach(m=>{m.map?.dispose();m.dispose()});
}
