'use strict';
/*
    This is the worker code 
    We will process isovists one at a time ( in groups of 8 ) 
*/ 

import { 
  isNumberAndNotNull , 
    isValidNumber, 
    isValidVRD_Point , 
    //isVRDPolygon, 
    pointInVRDPolygon, 
    polygonAreaVRD, 
    makeIsovistFrom , 
    trimIsovistByPolygons, 
    makePointVRD , 
    distanceVRD 

     } from './geometryVRD.js' ; 


/*
    This will recive 
    X, Y point of isovist 
    maxIsoivstRadius 
    boundingBoxPolyon or null 

    set of buildings 
    
    // returns 
    VRD format polgon of isovist 


    first message 
    message = { 
       messageID: 1 , 
       buildings = [ array of VRD-polygons ], 
       boundingBox = VRD-polygons, 
       debugX: number , 
       debugY: number 
    }
    
    processMessage = 
      { 
        message: 2 ,
        xCoord : number ,
        yCoord : number ,
        isovistID : any ,
    }
  
    message: 
    { 
      message : 3 
      isovistID: number 
      isovist : [ array of coords VRD format {x:, :}]
      points  : [ array of { x:, y:, index:}]

      // will return list of points which are within the isovist bounds 

      { 
      isoivstID: number 
      points : [ array of { x:, y:, index:} ] 
      }
    }
    
     message: 
    { 
      message : 4 
      isovistID: number 
      isovist : [ array of coords VRD format {x:, :}]
      isoivstID2: number 
      isovist2 : [ array of coords VRD format {x:, :}]

      // will return list of points which are within the isovist bounds 
      
      { 
       isovistID: number 
       isoivstID2: number 
       overlapArea: number 
       areaIsoivst1: number 
       areaIsovist2: number 
       untionArea: number 
      }
    }
      
*/ 

let gBuildingPolygonArray = null ;
let gBoundingPolygon = null ;  
onmessage = (e) => {
    //console.log("Message received from main script");
    let  messageFromWorker = e.data  ; 

    //console.log( typeof(  e.data ));
    const messageID = e.data.messageID ; 
    //console.log(Array.isArray(e.data)); 
    if( messageID == 1 )
    { 
      handleUploadBuildingoutlines(e.data ); 
    }else
    { 
      if( messageID == 2  )
      { 
        handleProcessIsovist( e.data ); 
      }else 
      {
        if( messageID == 3 )
        { 
          handlePointInIsovistChecks( e.data ); 
        }
      }
    }
    const workerResult = "Result: I AM WORKING"  ;
    //console.log("Posting message back to main script");
    //postMessage(workerResult);
  }
  //g_intersectionsWaiting_to_be_processed 
//-----------------------------------------------------
/* 
    const processFrame3 = 
    { 
        messageID: 3 , 
        xCoord : hoz ,
        yCoord : vert ,
        isovistID : idx  , // this is who to put the list of connections back to. 
        isovistOutline :  isovist.isovistPolygon ,
        isovistCentersToCheck: listOfIsovistCenters 
          // format { x: , y: ,  index:  }
    };

*/ 
function handlePointInIsovistChecks( processMessage ) 
{ 
    const isovsts = processMessage.isovistCentersToCheck ?? null ; 
    console.assert(isovsts !=null , " No centers to check "); 
    console.assert( Array.isArray( isovsts), "Not an array :130"); 

    const polygon = processMessage.isovistOutline ?? null ; 
    console.assert( polygon !=null, "No polygon to check "); 
    console.assert( Array.isArray( polygon ), " Not poly ") ; 

    let insidepoints = [] ; 
    // might be faster to get bounday first 
    for( const pnt of isovsts )
    { 
      if(  pointInVRDPolygon( pnt, polygon ))
      { 
        insidepoints.push( pnt ); 
      }
    }
    let result = 
    { 
      messageID: processMessage.messageID , //3 
      isovistID: processMessage.isovistID , 
      pointsInside_isovist : insidepoints 
    }; 
    postMessage(result);
}
//-----------------------------------------------------
/**
 * #WORK #CURRENRT 
 * @param {*} isovist 
 * @returns  [ isovist area ,  average radial , ]
 */
function calculateMeasures( isovist   )
{ 
  console.assert( (isovist?? null)  !=null, "expected isvist " ); 
  console.assert( Array.isArray( isovist), "Are you sure this is an isovist"); 
  console.assert( isovist.length > 0 , "Isovists must have at least one segment"); 
  console.assert( isovist[0] !=null , "impossible 168 "); 


   //console.assert( isVRDPolygon( polygon), "Expected polygon got something else "); 
   //console.assert( isValidVRD_Point( isovistCenterPt), "isovistCenterPt expected to be point"); 
   let area =   isovistArea( isovist ); 
   
   let totalRadial = 0.0 ; 
   let count = 0 ;  
   let lastSeg = isovist[ isovist.length-1 ]; assert( lastSeg!=null , "No 177"); 
   let perimeter = 0.0 ; 
   let minRadial = distanceVRD(  lastSeg.ps , lastSeg.pe   ); 
   let maxRadial = minRadial; 
   let centroid = { x:0 , y:0}; 
   let drifdist = 0 ; 
   for( let seg  of isovist )
  { 
    const  d =  distanceVRD(  seg.ps , seg.pe   ); 
    totalRadial += d ; 
    count += 1 ; 
    perimeter +=  distanceVRD( lastSeg.pe, seg.pe); 
    minRadial = Math.min( minRadial, d ); 
    maxRadial = Math.max( maxRadial, d ); 
    centroid.x += seg.pe.x ; 
    centroid.y += seg.pe.y ; 
    lastSeg = seg ; 
   }

   let average = 0 ; 
   if( count >  0 )
   { 
    average = totalRadial / count ; 
    centroid.x  =  centroid.x / count ; 
    centroid.y  =  centroid.y/ count ; 
    drifdist = distanceVRD( lastSeg.ps , centroid.y  );
   }else 
   { 
    average = -1 ; console.error("Isovist wih no edges?"); 
   }

   return [ area ,  perimeter ,  (area /perimeter), minRadial,  average, maxRadial , drifdist ]; 
} 
//-----------------------------------------------------
/**
 *  This does the ray/triangle intersection to produce the 
 *  isovist list of rays (Segments in VRD format ) 
 * 
 *  In the future it will use a quad tree to speed intersection up.
 *  processMessage = 
      { 
        messageID: 2 ,
        xCoord : number ,
        yCoord : number ,
        isovistID : any ,
    }

 * @param {*} processMessage 
 * @returns 
 */
function handleProcessIsovist( processMessage )
{ 
  if( gBuildingPolygonArray == null )
  { 
    console.error(" gBuildingPolygonArray has not been uploaded before isovist called"); 
    return; 
  }
  console.assert(  isValidNumber( processMessage.xCoord ) ," xCoord missing" ); 
  console.assert(  isValidNumber(processMessage.yCoord) ,  " xCoord missing" ); 
  let  mxRadius = 80 ; 
  if(  isValidNumber(processMessage.maxRadius) && processMessage.maxRadius> 0 ) 
  { 
    mxRadius = processMessage.maxRadius; 
  }
 
  let isoivst = makeIsovistFrom( processMessage.xCoord,processMessage.yCoord , mxRadius  ); 
  let iso = trimIsovistByPolygons(  isoivst, gBuildingPolygonArray, true );
  //let [ area ,  perimeter , areaPerimRatio , minRadial,  average, maxRadial , drifdist ]
  //     =  calculateMeasures( iso); 

  let isoID = processMessage.isovistID?? -1 ; 
  let result = 
  { 
    messageID: processMessage.messageID , 
    xCoord : processMessage.xCoord ,
    yCoord : processMessage.yCoord ,
    isovist: iso  ,
    isovistID: isoID
    //computed isovist measures 
   /* area : area , 
    perimeter: perimeter , 
    areaPerimRatio: areaPerimRatio , 
    minRadial:minRadial , 
    averageRadial: average , 
    maxRadial: maxRadial , 
    driftMagnitude: drifdist */ 
  }; 
  postMessage(result);
}
//-----------------------------------------------------
/**
 * 
 * @param {*} data 
 */
function handleUploadBuildingoutlines( data  )
{ 
  console.assert( data !=null); 
  console.assert( data.buildings  !== undefined, " No buildingins defined" );
  gBuildingPolygonArray =  data.buildings; 
  console.assert( data.boundingBox  !== undefined, " No boundingBox defined" );
  if(  data.boundingBox != null )
  { 
   //console.log("Add in bounding box"); 
    console.assert( data.boundingBox != null ,  " NULL bounding box ")
    gBoundingPolygon = data.boundingBox ; 
    gBuildingPolygonArray.push( data.boundingBox );
  }
}

// MAIN PROGRAM does nothing. The event handled does everything.
//console.log("Isovist Generators Worker  I AM ALIVE! "); 

