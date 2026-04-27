'use strict';
/*
  ______  ______ _____ ______                                          
 |  ____ |_____/   |   |     \                                         
 |_____| |    \_ __|__ |_____/                                         
                                                                       
                                                                       
                                                                       
                                                                                                                                 
 _____ _______  _____  _    _ _____ _______ _______                    
   |   |______ |     |  \  /    |   |______    |                       
 __|__ ______| |_____|   \/   __|__ ______|    |                       
                                                                       
  ______ _______ __   _ _______  ______ _______ _______  _____   ______
 |  ____ |______ | \  | |______ |_____/ |_____|    |    |     | |_____/
 |_____| |______ |  \_| |______ |    \_ |     |    |    |_____| |    \_
                                                                       
    This is the worker code 
*/ 

import { 
  isNumberAndNotNull , 
  isValidNumber, 
  isValidVRD_Point , 
  pointInVRDPolygon, 
  findDistSquardToClosestPointTo_fast, 
  workoutRange
    } from './geometryVRD.js' ; 

console.log("Grid worker alive"); 
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
                buildings: listOfFigures , // THE BIGGY 
            }; 
 */
// Catch any errors in the worker
self.onerror = function(error) {
    console.error( 'worker error=', error ); 
    postMessage('Worker encountered an error: ' + error.message);
  };


onmessage = (e) => {
    
    //console.log(  messageFromWorker = e.data ) ; 
    try
    { 
      const processFrame = e.data; 
      let workRange  = processFrame.yRange ; 
      let maxWorkers = processFrame.maxWorkers; 
      let buildings = processFrame.buildings ;
      let boundingPoly = processFrame.boundingPolygon; 
      let wrkID = processFrame.workerIdenity; 

      console.log(" Start grid " +  wrkID );
      //console.log("[Y]]",workRange.minCol, workRange.maxCo  ); 
      //console.log("b=",buildings.length);
      //console.log("Max w",maxWorkers )
      //console.log("wrk ",processFrame.workerIdenity );
    
      let [ chunkStart , chunkEnd ]  = 
          workoutRange( processFrame.yRange.minCol,
                          processFrame.yRange.maxCo ,
                          maxWorkers,  wrkID  ); 
      //console.log( wrkID, '=>', chunkStart, ' ' ,chunkEnd, "@", processFrame.yRange.spc ); 
      
      
      let candidate = { x:100 , y:150};
      let c = buildings[ 0 ]; 
      let isb = pointInVRDPolygon(candidate,  c );
    //console.log('Point OK' + isb); 
          
      
      //const ox = 6 * wrkID; 
      //const fake = [ [1+ox,2+ox,],[3+ox,4+ox]] ;
      
              // tollerance value is not the solution. 
      let candiates = [ ]  ;
      for( let k = chunkStart; k<  chunkEnd ; k+= processFrame.yRange.spc )
      { 
          //console.log(wrkID,k); 
          for(let  xv = processFrame.xRange.minRw; 
              xv < processFrame.xRange.mxRw; 
              xv += processFrame.xRange.spc  )
          { 
              //console.log(wrkID,k," VX =",  xv ); //<--- new code 
            
              let candiate  = { x:xv , y:k}; 
              console.assert(isValidVRD_Point(candiate), ' BIG ERROR');
              candiates.push( candiate ); 
          }
      } 
      
      //console.log("WK" + wrkID + "Generated " + candiates.length + "isovists"); 

      let isovistsFoundInWorker  = [ ] ; 
      let inSidebuilding = false  ; 
      let buldcounter = 0 ; 
      for( const ipoind of candiates )
      {
          console.assert(isValidVRD_Point(ipoind), 'VERT  BIG ERROR' + JSON.stringify(ipoind));
          
          for( const b of buildings)
          {
              inSidebuilding = pointInVRDPolygon(ipoind,  b );
              if( inSidebuilding == true )break ; 
          }
          if( inSidebuilding == false ) 
          {
              if(  boundingPoly == null )
              { 
                  isovistsFoundInWorker.push(ipoind ); // isovist to process.
              }else
              {
                  if(  pointInVRDPolygon( ipoind ,  boundingPoly )== true )
                  { 
                      isovistsFoundInWorker.push(ipoind ); // isovist to process.
                      buldcounter += 1; // why don't I want to use ++  ? 
                      if(buldcounter > 128)
                      { 
                          const returnResult = 
                          { 
                              workerID : wrkID , 
                              complete: false  , 
                              foundIso: isovistsFoundInWorker 
                          };
                          console.log("posting"); 
                          buldcounter = 0  ;
                          postMessage(returnResult);
                          isovistsFoundInWorker = [ ] ; 
                      }
                    
                  }// END IF inside the bounding polyon 
              } 
          }// END IF NOT  inSideBuilging == false
      
      }

      const returnResult = 
      { 
          workerID : wrkID,
          complete: true , 
          foundIso: isovistsFoundInWorker 
      }; 
      
      console.log(" End grid #" +  wrkID );
      postMessage(returnResult);
    }
    catch (error)  //# ERROR  - desperate bit to figoure out. webworkers.
    { 
      const returnError = 
      { 
        workerID : wrkID,
        complete: true , 
        message: error.message 
      }
      postMessage(returnError);
    }
    

  };


/* 
 this version Yeilds to the main thread. 
*/ 
/*
onmessage = (e) => {
    const processFrame = e.data;
    const xRange = processFrame.xRange;
    const yRange = processFrame.yRange;
    const maxWorkers = processFrame.maxWorkers;
    const buildings = processFrame.buildings;
    const boundingPoly = processFrame.boundingPolygon;
    const wrkID = processFrame.workerIdenity;
  
    console.log("Start grid " + wrkID);
  
    // Determine the Y range chunk for this worker:
    let [chunkStart, chunkEnd] = workoutRange(yRange.minCol, yRange.maxCo, maxWorkers, wrkID);
    console.log(wrkID, '=>', chunkStart, chunkEnd, "@", yRange.spc);
  
    // Phase 1: Generate candidate points asynchronously.
    let candidates = [];
    let currentY = chunkStart;
  
    function processCandidateRow() {
      if (currentY >= chunkEnd) {
        console.log("Worker " + wrkID + " generated " + candidates.length + " candidates");
        // Once candidate generation is done, begin processing them.
        processCandidatesChunk(0);
        return;
      }
  
      // Process one row (all x points at currentY)
      for (let xv = xRange.minRw; xv < xRange.mxRw; xv += xRange.spc) {
        const candidate = { x: xv, y: currentY };
        console.assert(isValidVRD_Point(candidate), 'BIG ERROR: invalid candidate ' + JSON.stringify(candidate));
        candidates.push(candidate);
      }
  
      // Yield control: process next row after a 0ms timeout.
      currentY += yRange.spc;
      setTimeout(processCandidateRow, 0);
    }
  
    // Phase 2: Process candidates in chunks asynchronously.
    const isovistsFoundInWorker = [];
    const candidateChunkSize = 100; // Process 100 candidates per chunk.
    function processCandidatesChunk(startIndex) {
      const endIndex = Math.min(startIndex + candidateChunkSize, candidates.length);
      for (let i = startIndex; i < endIndex; i++) {
        const ipoind = candidates[i];
        console.assert(isValidVRD_Point(ipoind), 'VERT BIG ERROR: ' + JSON.stringify(ipoind));
        if (!isValidVRD_Point(ipoind)) continue;
  
        // Check against buildings.
        let inSidebuilding = false;
        for (const b of buildings) {
          inSidebuilding = pointInVRDPolygon(ipoind, b);
          if (inSidebuilding) break;
        }
  
        if (!inSidebuilding) {
          // If there's no bounding polygon, accept the point.
          if (!boundingPoly) {
            isovistsFoundInWorker.push(ipoind);
          } else if (pointInVRDPolygon(ipoind, boundingPoly)) {
            isovistsFoundInWorker.push(ipoind);
          }
        }
      }
  
      // If there are more candidates, yield control to process the next chunk.
      if (endIndex < candidates.length) {
        setTimeout(() => processCandidatesChunk(endIndex), 0);
      } else {
        console.log("End grid #" + wrkID);
        postMessage(isovistsFoundInWorker);
      }
    }
  
    // Start processing the candidates row-by-row.
    processCandidateRow();
  };

  */ 

  /*

  this._numberOfWorkersPosted += 1 ; 
  
  processMessageFromWorker( workerIndex, info )
  { 
    console.log("# remain "+  this.numberOfMessagesBeginProcessed ); 
     
    let isovists = info.foundIso  ; 
    for(let  it of isovists ) //console.log(  JSON.stringify(it) ); 
    { 
      let iso = new Isovist( it.x  ,it.y, null  ); 
      gAllIsovists.push(iso); 
      
      //gValidIsovistPoints.push(iso ) ; // My first spread operator 
      //print( it.x, it.y ); 
    }
    if( info.complete == true )
    { 
      this._numberOfWorkersPosted -= 1 ; 
      if( this._numberOfWorkersPosted ==0 )
      { 
        console.log("PROCESSING GENERATE COMPELTE "); 
        this.numberOfMessagesBeginProcessed = 0 ; 
      }
    }
    else 
    { 
      // We fake up the nubmer of workers for the super class. 
      this.numberOfMessagesBeginProcessed += 1; 
    }
    // console.log("Recived  " + c + " Isovists "); 
  }
    */ 