'use client';
import {useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {ThreeMFLoader} from 'three/examples/jsm/loaders/3MFLoader.js';

export default function ModelPreview({file}:{file:File|null}) {
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!file||!host.current)return;const element=host.current;element.querySelectorAll(".preview-error").forEach(node=>node.remove());let disposed=false;let frame=0;let object:THREE.Object3D|null=null;
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(40,1,.01,1000);camera.position.set(2.6,2,3.2);
 let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{element.textContent='อุปกรณ์นี้ไม่รองรับการแสดงโมเดล 3D';return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);element.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0x423045,2));const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(4,5,5);scene.add(light);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;
 const resize=()=>{const width=element.clientWidth,height=Math.max(element.clientHeight,180);renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(element);resize();
 const animate=()=>{frame=requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)};animate();
 file.arrayBuffer().then(buffer=>{if(disposed)return;const ext=file.name.split('.').pop()?.toLowerCase();if(ext==='stl'){const geometry=new STLLoader().parse(buffer);geometry.computeVertexNormals();object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xd7b8ec,roughness:.42,metalness:.12}))}else if(ext==='obj'){object=new OBJLoader().parse(new TextDecoder().decode(buffer))}else if(ext==='3mf'){object=new ThreeMFLoader().parse(buffer)}else throw Error('unsupported');if(!object)throw Error('empty');const bounds=new THREE.Box3().setFromObject(object);const size=bounds.getSize(new THREE.Vector3());const max=Math.max(size.x,size.y,size.z);if(!Number.isFinite(max)||max<=0)throw Error('empty');const center=bounds.getCenter(new THREE.Vector3());object.position.sub(center);const group=new THREE.Group();group.add(object);group.scale.setScalar(2/max);scene.add(group);controls.update()}).catch(()=>{if(!disposed){const msg=document.createElement('p');msg.className='preview-error';msg.textContent='แสดงภาพตัวอย่างไม่ได้ กรุณาตรวจไฟล์';element.appendChild(msg)}});
 return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();const materials=Array.isArray(node.material)?node.material:[node.material];materials.forEach(material=>material.dispose())}});renderer.dispose();renderer.domElement.remove();element.querySelectorAll(".preview-error").forEach(node=>node.remove())};
 },[file]);
 if(!file)return null;return <div className="model-preview" ref={host} aria-label="ภาพตัวอย่างโมเดล 3 มิติ ลากเพื่อหมุนดู"/>;
}

