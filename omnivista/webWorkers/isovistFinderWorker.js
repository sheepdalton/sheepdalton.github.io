'use strict';
/* Isovist Finder worker 
  ___ ___  _____   _____ ___ _____  
 |_ _/ __|/ _ \ \ / /_ _/ __|_   _| 
  | |\__ \ (_) \ V / | |\__ \ | |   
 |___|___/\___/ \_/ |___|___/ |_|   
                                    
  ___ ___ _  _ ___  ___ ___         
 | __|_ _| \| |   \| __| _ \        
 | _| | || .` | |) | _||   /        
 |_| |___|_|\_|___/|___|_|_\        
                                    
 __      _____  ___ _  _____ ___    
 \ \    / / _ \| _ \ |/ / __| _ \   
  \ \/\/ / (_) |   / ' <| _||   /   
   \_/\_/ \___/|_|_\_|\_\___|_|_\ 
   */ 
/*
    2 Jobs. 

    1. Find the isovist given the building outline. ( handleProcessIsovist )
      1.1 Also computes basic geometric properites. 
    2. Finds if any of list of point is in any of the building onlines. 

    
    handleProcessIsovist could be sped up with QuadTree. 

*/ 

import { 
    isNumberAndNotNull , 
    isValidNumber, 
    isValidVRD_Point , 
    pointInVRDPolygon, 
    getBoundingBoxVRD,
    isPoint_Outside_VRDBoundingBox,
    findDistSquardToClosestPointTo_fast, 
    workoutRange, 
    makeIsovistFrom , 
    trimIsovistByPolygons, 
    isovistArea,  // NEW 
    distanceVRD // new  
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
/*function calculateHuMoments(points) {
  // Step 1: Compute raw moments m00, m10, and m01.
  let m00 = 0, m10 = 0, m01 = 0;
  for (const p of points) {
    m00 += 1;        // Each point contributes a weight of 1.
    m10 += p.x;
    m01 += p.y;
  }
  
  // Check for a valid shape (non-zero area/number of points)
  if (m00 === 0) {
    throw new Error("The shape contains no points.");
  }
  
  // Step 2: Compute the centroid (x̄, ȳ).
  const xBar = m10 / m00;
  const yBar = m01 / m00;
  
  // Step 3: Compute central moments (needed orders: 2 and 3).
  let mu11 = 0, mu20 = 0, mu02 = 0;
  let mu30 = 0, mu03 = 0, mu21 = 0, mu12 = 0;
  
  for (const p of points) {
    const dx = p.x - xBar;
    const dy = p.y - yBar;
    
    mu11 += dx * dy;
    mu20 += dx * dx;
    mu02 += dy * dy;
    
    mu30 += dx * dx * dx;
    mu03 += dy * dy * dy;
    mu21 += dx * dx * dy;
    mu12 += dx * dy * dy;
  }
  
  // For our case, mu00 equals m00.
  const mu00 = m00;
  
  // Step 4: Compute normalized central moments η_pq.
  // For second order moments (p+q = 2), exponent = 1 + 2/2 = 2.
  const eta20 = mu20 / Math.pow(mu00, 2);
  const eta02 = mu02 / Math.pow(mu00, 2);
  const eta11 = mu11 / Math.pow(mu00, 2);
  
  // For third order moments (p+q = 3), exponent = 1 + 3/2 = 2.5.
  const eta30 = mu30 / Math.pow(mu00, 2.5);
  const eta03 = mu03 / Math.pow(mu00, 2.5);
  const eta21 = mu21 / Math.pow(mu00, 2.5);
  const eta12 = mu12 / Math.pow(mu00, 2.5);
  
  // Step 5: Compute the Hu moments using the normalized central moments.
  const hu = [];
  
  // Hu Moment 1
  hu[0] = eta20 + eta02;
  
  // Hu Moment 2
  hu[1] = Math.pow(eta20 - eta02, 2) + 4 * Math.pow(eta11, 2);
  
  // Hu Moment 3
  hu[2] = Math.pow(eta30 - 3 * eta12, 2) + Math.pow(3 * eta21 - eta03, 2);
  
  // Hu Moment 4
  hu[3] = Math.pow(eta30 + eta12, 2) + Math.pow(eta21 + eta03, 2);
  
  // Hu Moment 5
  hu[4] = (eta30 - 3 * eta12) * (eta30 + eta12) *
            (Math.pow(eta30 + eta12, 2) - 3 * Math.pow(eta21 + eta03, 2)) +
          (3 * eta21 - eta03) * (eta21 + eta03) *
            (3 * Math.pow(eta30 + eta12, 2) - Math.pow(eta21 + eta03, 2));
  
  // Hu Moment 6
  hu[5] = (eta20 - eta02) *
            (Math.pow(eta30 + eta12, 2) - Math.pow(eta21 + eta03, 2)) +
          4 * eta11 * (eta30 + eta12) * (eta21 + eta03);
  
  // Hu Moment 7
  hu[6] = (3 * eta21 - eta03) * (eta30 + eta12) *
            (Math.pow(eta30 + eta12, 2) - 3 * Math.pow(eta21 + eta03, 2)) -
          (eta30 - 3 * eta12) * (eta21 + eta03) *
            (3 * Math.pow(eta30 + eta12, 2) - Math.pow(eta21 + eta03, 2));
  
  return hu;
}
*/

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
   let lastSeg = isovist[ isovist.length-1 ]; 
   console.assert( lastSeg!=null , "No 177"); 
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
    drifdist = distanceVRD( lastSeg.ps , centroid  );
   }else 
   { 
    average = -1 ; console.error("Isovist wih no edges?"); 
   }

   return [ area ,  perimeter ,  (area /perimeter), minRadial,  average, maxRadial , drifdist ]; 
} 

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

    @@@ TODO -is it faster to render polygon into bitmap ( if small enough )in GL
    the test if point is black or not?

*/ 
function handlePointInIsovistChecks( processMessage ) 
{ 
    const isovsts = processMessage.isovistCentersToCheck ?? null ; 
    console.assert(isovsts !=null , " No centers to check "); 
    console.assert( Array.isArray( isovsts), "Not an array :130"); 

    const polygon = processMessage.isovistOutline ?? null ; 
    console.assert( polygon !=null, "No polygon to check "); 
    console.assert( Array.isArray( polygon ), " Not poly ") ; 
    const bbox = getBoundingBoxVRD(  polygon);

    let insidepoints = [] ; 
    // might be faster to get bounday first 
    for( const pnt of isovsts )
    { // before 2172 , 2994 , 2912 , 290
      // 1044, 1025 ,1021 so twice as fast.
      if( isPoint_Outside_VRDBoundingBox( pnt,bbox  ))continue ; // skip 
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
  let [ area ,  perimeter , areaPerimRatio , minRadial,  average, maxRadial , drifdist ]
        =  calculateMeasures( iso); 


  let isoID = processMessage.isovistID?? -1 ; 
  let result = 
  { 
    messageID: processMessage.messageID , 
    xCoord : processMessage.xCoord ,
    yCoord : processMessage.yCoord ,
    isovist: iso  ,
    isovistID: isoID, 
    area : area , 
    perimeter: perimeter , 
    areaPerimRatio: areaPerimRatio , 
    minRadial:minRadial , 
    averageRadial: average , 
    maxRadial: maxRadial , 
    driftMagnitude: drifdist
  }; 
  postMessage(result);
}
//-----------------------------------------------------
/**
 *  should make a store of bounding boxes. 
 * @param {*} data 
 */
function handleUploadBuildingoutlines( data  )
{ 
  console.assert( data !=null); 
  console.assert( data.buildings  !== undefined, " No buildingins defined" );
  
  gBuildingPolygonArray =  data.buildings; 
  console.assert( Array.isArray(gBuildingPolygonArray  ), 'no buildings W304');
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

