'use strict';
/*
            ____    __    _  _  ____  _____  __  __                
            (  _ \  /__\  ( \( )(  _ \(  _  )(  \/  )               
            )   / /(__)\  )  (  )(_) ))(_)(  )    (                
            (_)\_)(__)(__)(_)\_)(____/(_____)(_/\/\_)               
            ____  ___  _____  _  _  ____  ___  ____                
            (_  _)/ __)(  _  )( \/ )(_  _)/ __)(_  _)               
            _)(_ \__ \ )(_)(  \  /  _)(_ \__ \  )(                 
            (____)(___/(_____)  \/  (____)(___/ (__)                
      ___  ____  _  _  ____  ____    __   ____  _____  ____ 
    / __)( ___)( \( )( ___)(  _ \  /__\ (_  _)(  _  )(  _ \
    ( (_-. )__)  )  (  )__)  )   / /(__)\  )(   )(_)(  )   /
    \___/(____)(_)\_)(____)(_)\_)(__)(__)(__) (_____)(_)\_)
 
 
    This generates a random position based on the band passed in. 

*/ 
// MUST HAVE MODULE defined in webworker 
import { 
         isNumberAndNotNull , 
         isValidNumber, 
         isValidVRD_Point , 
         pointInVRDPolygon, 
         findDistSquardToClosestPointTo_fast, 
         workoutRange
           } from './geometryVRD.js' ; 
/* 
    I would like to use an include but you cannot do this with a worker 
    AND an P5 thing. 
*/ 

/*
// shoudl this be part of isvoists ? 
let  gSHOW_FULL_ISOVIST = false  ; 
let  gSHOW_ISIVST_CONNECTIONS = false  ; 
let  gSHOW_ISOVISTS_DOT = true ; 
*/ 
//-------------------------------------
/*function isNumberAndNotNull(value) {
    return typeof value === 'number' && value !== null;
  }*/ 
  function getRandomBetween(a, b) {
    return Math.random() * (b - a) + a;
  }

/**
 * recive a message from the main thread  in form 
 *      const processFrame = 
            { 
                // this defines the work to do.  
                xRange: { minRw: minXRow ,
                          mxRw: maxRow,
                          spc:  spaceing  }, 
                yRange: { minCol: yColMin , 
                            maxCo: yColMax , 
                            spc : spaceing },
                maxWorkers: gNumberOfProcessors , 
                workerIdenity: w , 
                buildings: listOfFigures , 
            }; 
 */
/*
function binarySearchClosest(arr, target) {
  // Step 1: Sort the array (if it's not already sorted)
  arr.sort((a, b) => a - b);

  let left = 0;
  let right = arr.length - 1;
  let closestIndex = -1;
  let closestDiff = Infinity;  // Initialize with a large number

  // Step 2: Binary search for the closest value
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const diff = Math.abs(arr[mid] - target);

    // If the current difference is smaller than the closest difference, update
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = mid;
    }

    // Adjust the search range
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Step 3: Return the index of the closest value
  return closestIndex;
}

*/ 

//-----------------------------------------------------------------------------
/**
 * return   the Distance Squard To  Closest Point To a 
 * @param {point in VRD format } point 
 * @param {array of points in VRD format } arrayOfPoints_sorted 
 * @returns 
 */
/*function findDistSquardToClosestPointTo( point , arrayOfPoints_sorted)
{ 
  console.assert( isValidVRD_Point( point ), "argument point is not vald VRD point"); 
  console.assert(  Array.isArray(arrayOfPoints_sorted) , "Argument not valid array: 237") ; 

  let minDist = Number.MAX_VALUE; 
  let minPoint = null ; 

  if(  arrayOfPoints_sorted.length == 0 ) return Number.MAX_VALUE; 

  for( const p of arrayOfPoints_sorted )
  { 
    console.assert( isValidVRD_Point( p ), "argument point is not vald VRD point"); 
    const dis =   ((point.x - p.x)**2 )+ (( point.y-p.y )**2) ; 
    if( dis < minDist)
    { 
      minPoint = p ; 
      minDist = dis ; 
    }
  }

  console.assert( minPoint!=null , "should not happed :225");
  return minDist; 
}*/

//-----------------------------------------------------------------------------
/**
 *  generates points randomly but avoids clumping by keeping them away from the others. 
 * @param {number} xmin 
 * @param {number} xmax 
 * @param {number} ymin 
 * @param {number} ymax 
 * @param {array of points in VRD format } arrayOfPoints_sorted 
 * @param {array of buildings in VRD polygon format } listOfBuildings 
 * @returns 
 */
function generateBestPoint( xmin, xmax , ymin , ymax , 
  arrayOfPoints_sorted , listOfBuildings ,  boundingPolygon )
{ 
  console.assert( isValidNumber( xmin), "Expected number in xmin 239"); 
  console.assert( isValidNumber( xmax), "Expected number in xmax 240"); 
  console.assert( isValidNumber( ymin), "Expected number in xmax 241"); 
  console.assert( isValidNumber( ymax), "Expected number in xmax 242");
  console.assert( xmax > xmin, "Expected range  in xmax 243");
  console.assert( ymax > ymin, "Expected range  in xmax 244");
  // Generate 7 candiate points. 
  // Use the one furthers from the nearest point 
  let furthestPoint = null ;
  let furthestDistance = 0 ; 
  let dist = 0 ; 
  let countOfInsideBoudingPolygon = 0 ; 
  let totalCountOfAllPointsGenerated = 0 ; 
   
   // TODO = use a timeout to stop running for ever. 
   for( let t = 0 ; t < 7 ; t++ ) // Generate 7 candidate points. 
   { 
    let ipoind = { x:0 , y:0}; 
    let result = false  ; 
    do // Make sure the candidate is outside the world
    { 
      ipoind.x  = getRandomBetween( xmin, xmax  );
      ipoind.y  = getRandomBetween( ymin, ymax  ); 
    
      if( boundingPolygon !=null )// point must be in bounding box. 
      { 
        do{
          totalCountOfAllPointsGenerated += 1; 
          ipoind.x  = getRandomBetween( xmin, xmax  );
          ipoind.y  = getRandomBetween( ymin, ymax  ); 
          }while( pointInVRDPolygon( ipoind , boundingPolygon) ==false ); 
          countOfInsideBoudingPolygon+= 1 ; 
      }else  // any where in bounding box OK. 
      { 
        ipoind.x  = getRandomBetween( xmin, xmax  );
        ipoind.y  = getRandomBetween( ymin, ymax  ); 
      }

      for( const b of listOfBuildings)
        {
              result = pointInVRDPolygon(ipoind,  b );
             
              if( result == true )break ;
        } 
      } while( result == true) ; // keep making points util find one in space
      console.assert( result == false , "impossible 284"); 
      const dist = findDistSquardToClosestPointTo_fast(ipoind , arrayOfPoints_sorted ); 
      if( dist > furthestDistance )
      { 
        furthestDistance = dist ; 
        furthestPoint = ipoind; 
      }
    } // for  each candiates 
    console.assert( dist <= furthestDistance , "Impossible 291"); 
    console.assert( totalCountOfAllPointsGenerated > 0 , "impossibl3 196"); 
    return [ furthestPoint,  countOfInsideBoudingPolygon/totalCountOfAllPointsGenerated ] ;
}

//-----------------------------------------------------------------------------
/**
 * THIS IS THE WORKER FUNCTION 
 * 
 * Called from @see Generate_STOCASTIC_IsovsitInteractive , 
 * @see generateAllIsovists
 * returns to 
 * 
 * @see messageRecivedFromIsovst_grid_generator_Worker 
 * returns to @errorFromWorker on error 
 * 
 * Unpacks 
 *  const processFrame = 
        { 
            // this defines the work to do.  
            xRange: { minRw: minXRow ,
                      mxRw: maxRow,
                      spc:  spaceing  }, 
            yRange: { minCol: yColMin , 
                        maxCo: yColMax , 
                        spc : spaceing },
            maxWorkers: numberOfProcessors , 
            workerIdenity: w , 
            buildings:  listOfbuildings_inVRD_poly_format, 
            boundingPolygon : boundingBoxCanBeNullVRD_poly_format ,  
            isoVistsDensity: 100 
        };
    
        How to measure density .. 
 * 
 */
onmessage = (e) => {
    //console.log("Message received from main script");
    //console.log(  messageFromWorker = e.data ) ; 
    ///gGraphWorkers.push( workr ); 
    //gGraphWorkersSetupInprogress
    const processFrame = e.data; 
    let workRange  = processFrame.yRange ; 
    let maxWorkers = processFrame.maxWorkers; 
    let buildings = processFrame.buildings ; 
    let boundingPoly = processFrame.boundingPolygon; 
    let wrkID = processFrame.workerIdenity; 

     if( boundingPoly == null )
     { 
      console.log("NO bounding polygon");
     }else 
     {
      console.log("bounding polygon l=" + boundingPoly.length )
     }
    //console.log("[Y]]",workRange.minCol, workRange.maxCo  ); 
    //console.log("b=",buildings.length);
    //console.log("Max w",maxWorkers )
    //console.log("wrk ",processFrame.workerIdenity );
   //  
    let [ chunkStart , chunkEnd ]  = 
        workoutRange( processFrame.yRange.minCol,
                        processFrame.yRange.maxCo ,
                        maxWorkers,  wrkID  ); 
    //console.log( wrkID, '=>', chunkStart, ' ' ,chunkEnd, "@", processFrame.yRange.spc ); 
    //const ox = 6 * wrkID; 
    //const fake = [ [1+ox,2+ox,],[3+ox,4+ox]] ;
    const output  = [ ] ;
    let areaFraction = 0, areaFraction2 = 0  ; 
    const xstart =  processFrame.xRange.minRw; 
    const xend   =  processFrame.xRange.mxRw; 
    const ystart =  chunkStart;
    const yend   =  chunkEnd;

    for( let k = chunkStart; k<  chunkEnd ; k+= processFrame.yRange.spc )
    { 
        for(let  xv = processFrame.xRange.minRw; 
              xv < processFrame.xRange.mxRw; 
              xv += processFrame.xRange.spc  )
        { 
            let inSideBuilding = false  ; 
            //let ipoind = { x:xv , y:k};// OLD
            let xV2 = xv  + (Math.random()-0.5)* processFrame.xRange.spc  ; 
            let vy2 = k   + (Math.random()-0.5)* processFrame.yRange.spc  ;
            let ipoind = { x:xV2 , y:vy2};
            ///Math.getRandomBetween( ) 
 
            for( const b of buildings)
            {
                inSideBuilding = pointInVRDPolygon(ipoind,  b );
                if( inSideBuilding == true )break ; 
            } 

            if(  inSideBuilding == false ) 
            {
              if(  pointInVRDPolygon( ipoind ,  boundingPoly )== true )
              { 
                  // console.log( "TRY", k,  JSON.stringify(ipoind ));
                 // output.push(ipoind ); // isovist to process.
                for(let k = 0 ; k < 1; k++ )
                {
                  let [ newGoodPoint , areaFraction2 ]  = generateBestPoint( xstart, xend , ystart, yend , output, buildings , boundingPoly );
                  areaFraction = areaFraction2 ; 
                  output.push( newGoodPoint );
                  //console.log(`new point ${newGoodPoint.x.toFixed(1)}  ${newGoodPoint.y.toFixed(1)} ` );
                  output.sort((a, b) => a.x - b.x);// need to asure that the list is sorted.
                } // END FOR 
              }// END IF inside the bounding polyon  
            }// END IF NOT  inSideBuilging == false
        } 
    }//start_stocastic_sequence  doAllRegularGirdIsovist
    const returnResult = 
    { 
        workerID : wrkID,
        complete: true , 
        foundIso: output 
    }; 

    postMessage(returnResult);
  };

/*
const  vertcount =  (chunkEnd-chunkStart )/ processFrame.yRange.spc; 
    const  hozCount =  (processFrame.xRange.mxRw- processFrame.xRange.minRw)/processFrame.xRange.spc;
    const  count =  (Math.floor(vertcount*hozCount) ) | 0 ; // integer divide hack.
    console.assert( Number.isInteger(count), "Formula error 208"); 
    console.log("GENERATOR: Isovists to make " + count ); 
    //console.log( processFrame.xRange.minRw );
    let areaFraction = 0 ; 
    for( let k = 0; k< count ; k++ )
    { 
     
   
    } // O(N^2 log(N) ish...)
    */ 
 /*
    console.log( "Item 0 " , inputVec[ 0 ] ); 
    console.log( "Item 1 " , inputVec[ 1 ] ); 
    const workerResult = "Result:"  + inputVec.join("::") ;
    console.log( "Worker:: my calc = ", workerResult  ) ; 
    console.log("Posting message back to main script");
*/ 

//console.log(" Random isovist generater OK"); 
/*var i = 0;

function //timedCount() {
  i = i + 1;
  //postMessage(i);
  setTimeout("timedCount()",500);
}
console.log(" Worker  I AM ALIVE! "); 

timedCount();
console.log(" Worker: I AM DONE  "); 
*/ 
// Even here the worker is still alive
