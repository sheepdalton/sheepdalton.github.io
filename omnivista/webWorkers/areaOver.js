
'use strict';
/*
    _   ___ ___   _      _____   _____ ___ _      _   ___ 
   /_\ | _ \ __| /_\    / _ \ \ / / __| _ \ |    /_\ | _ \
  / _ \|   / _| / _ \  | (_) \ V /| _||   / |__ / _ \|  _/
 /_/ \_\_|_\___/_/_\_\__\___/_\_/_|___|_|_\____/_/ \_\_|  
       \ \    / / _ \| _ \ |/ / __| _ \                   
        \ \/\/ / (_) |   / ' <| _||   /                   
         \_/\_/ \___/|_|_\_|\_\___|_|_\  
         
    This is the CORRECT productin worker code 
*/ 

import { 
  isNumberAndNotNull , 
  isValidNumber, 
  isValidVRD_Point , 
  pointInVRDPolygon, 
  polygonAreaVRD, 
  convertVRDPolygonToIsovistFromCenter, 
  computeIntersectionOfIsovists,
  debugGetInerSectionZones, 
  workoutRange
    } from './geometryVRD.js' ; 

/*
For the Area of overlap intergration 

 MinHeap for the priority que. 

 Might be easier to make simple one and then create Priority Que using 
 { value: x , target:object }
*/ 
const DEBUG = true ; 
const VEROBSE = false ; 

let isFirst = true   ; 
/*
 * 
 */
onmessage = (e) => {
    //console.log("Message received from main script");
    //console.log(  e.data ) ; 
    //console.log( typeof(  e.data ));

   // if( isFirst == true ) {   console.profile("ISO");  }
    
    processAreaOverlap( e.data ); 
   // if( isFirst == true )  {  console.profileEnd("ISO");  isFirst = false ;    }
   
    // const workerResult = "Result:"  ;
    //console.log( "Worker:: my calc = ", workerResult  ) ; 
    //console.log("Posting message back to main script");
   // postMessage(workerResult);
  };
/* let areaMessage = 
  { 
     message: 42 , 
     messageCheck: 'AreaOfOverlap', 
     polygon_A_ID : isovist_a_ID , 
     polygonA : isovistA_Polygon , 
     polygon_B_ID : connectedIsovists_b_ID , 
     polygonB : isovistB_Polygon , 
    
     areaOfA: 0 ,  // result 
     areaOfB: 0 , // result 
     unionArea: 0 , // result 
     intersectionArea: 0  , // result 
     jaccardFraction : 0 // result 
  };
*/ 
/**
 * 
 * @param {message} areaMessage 
 */

function processAreaOverlap( areaMessage )
{ 
  if( areaMessage.message != 42 )
  { 
    console.log("Area Overlap not understood " + areaMessage.message  ); 
    return ; 
  }
  console.assert( areaMessage.messageCheck == 'AreaOfOverlap', 'Bad message check abort'); 
  //c//onsole.log( `Isovist A ${areaMessage.polygon_A_ID}`); 
  const areaOFA = polygonAreaVRD( areaMessage.polygonA ); 
  const aredOfB = polygonAreaVRD( areaMessage.polygonB ); 
  const centerA = areaMessage.polygon_A_centroid ; 
  console.assert( Number.isFinite( centerA.x  ) , "Not center "); 

  const isoA = convertVRDPolygonToIsovistFromCenter(  areaMessage.polygonA , centerA ); 
  const isoB = convertVRDPolygonToIsovistFromCenter( areaMessage.polygonB, areaMessage.polygon_B_centroid ) ; 
  let [  total_intersection_Area , areaA, bArea , unionArea] = 
                      computeIntersectionOfIsovists(isoA, isoB );

  if( VEROBSE )
  { 
    console.log( `A = ${areaOFA.toFixed(1)}=, ${areaA.toFixed(1)} `); 
    console.log( `B = ${aredOfB.toFixed(1)} = ${bArea.toFixed(1)} =  `); 
    console.log( `intersection = ${total_intersection_Area}`); 
  } 
  areaMessage.areaOfA = areaA; 
  areaMessage.areaOfB = bArea; 
  areaMessage.unionArea = unionArea; 
  areaMessage.intersectionArea = total_intersection_Area; 
  if( unionArea > 0.0 )
  {
     areaMessage.jaccardArea =  total_intersection_Area/ unionArea ; 
  }else 
  { 
    areaMessage.jaccardArea = 0.0 ; 
  }
  if( areaA > 0.0  ) 
  { 
      areaMessage.asymetricAreaOfOverlapFraction = total_intersection_Area / areaA; 
  } else 
  { 
    areaMessage.asymetricAreaOfOverlapFraction = 0.0;
  }

  if( DEBUG == true )
  { 
    areaMessage.InterSectZones = debugGetInerSectionZones(); 
  }
  postMessage( areaMessage ); 
}
/*
var i = 0;
function timedCount() {
  i = i + 1;
  //postMessage(i);
  setTimeout("timedCount()",500);
}
*/ 
//console.log("AREAOVER:: hello");

//console.log("AREAOVER::I AM Isovist finder ! "); 


