import {STLLoader} from 'three/examples/jsm/loaders/STLLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
export async function estimate(file:File,material:string,infill:number,qty:number){
 if(!['PETG','PETG-CF'].includes(material))throw Error('วัสดุนี้ยังไม่มีราคาประเมิน');
 if(file.size>12*1024*1024)throw Error('ไฟล์นี้ต้องประเมินโดยทีมงาน');
 const buffer=await file.arrayBuffer();let root:THREE.Object3D;
 if(/\.stl$/i.test(file.name))root=new THREE.Mesh(new STLLoader().parse(buffer));
 else if(/\.obj$/i.test(file.name))root=new OBJLoader().parse(new TextDecoder().decode(buffer));
 else throw Error('ไฟล์ 3MF ส่งให้ทีมงานประเมินได้ ราคาทันทีรองรับ STL และ OBJ');
 let volume=0,area=0,count=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),ab=new THREE.Vector3(),ac=new THREE.Vector3(),cross=new THREE.Vector3();root.updateMatrixWorld(true);
 root.traverse(node=>{if(!(node instanceof THREE.Mesh))return;const g=node.geometry;const pos=g.getAttribute('position');const indices=g.index;const n=indices?indices.count:pos.count;for(let i=0;i+2<n;i+=3){if(++count>250000)throw Error('โมเดลละเอียดมาก ให้ทีมงานประเมิน');a.fromBufferAttribute(pos,indices?indices.getX(i):i).applyMatrix4(node.matrixWorld);b.fromBufferAttribute(pos,indices?indices.getX(i+1):i+1).applyMatrix4(node.matrixWorld);c.fromBufferAttribute(pos,indices?indices.getX(i+2):i+2).applyMatrix4(node.matrixWorld);volume+=a.dot(cross.crossVectors(b,c))/6;area+=cross.crossVectors(ab.subVectors(b,a),ac.subVectors(c,a)).length()/2}g.dispose()});
 volume=Math.abs(volume);if(!Number.isFinite(volume)||volume<=0||!Number.isFinite(area))throw Error('อ่านปริมาตรไม่ได้ กรุณาตรวจโมเดลปิดสนิท');
 const shell=Math.min(volume,area*.8);const plastic=shell+(volume-shell)*infill/100;const grams=plastic/1000*(material==='PETG'?1.27:1.25);const totalBaht=Math.ceil(grams*(material==='PETG'?200:500)/1000*3*qty*100)/100;
 return {totalBaht,gramsPerPiece:Math.round(grams*100)/100,dimensionsUnit:'mm',method:'geometry-estimate-v1',notice:'ประมาณจากรูปทรงหน่วยมิลลิเมตร ผนัง 0.8 มม. ยังไม่รวมซัพพอร์ตและการจัดวางจริง ยืนยันราคาก่อนผลิต'};
}
