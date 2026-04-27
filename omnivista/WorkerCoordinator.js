'use strict';

/**
 * 
 *  areaOver.js                     | AreaOfOverlapController          | areaOverLp_Cntrlr 
 *  fractional_Intergration_wkr.js  | FractionIngrationController      | gFracIntergrationController
 *  gridIsovistGenertorWorker.js    | RegulardGridGEneratorController  | gRegulardGridGEneratorController 
 *  stocasticIsoGeneratorWorker.js  | StocasticGridGeneratorControler  | gStocastic_grid_generator_controller 
 *  isovistFinderWorker.js          | IsovistGeometryController        | gIsovistGeometryController
 *  stepDepthWorker.js              | StepDepthController              | gStepDepthController 
 * 
 */
//===================================================================
/**
 * 
 * New - The worker coordinator does 3 jobs
 * 1. Manages the creation/termination of workers. 
 * 2. Encodes Data to send methods to the workers 
 * 2.5 Spreads the work over a number of workers. 
 * 3. Recives and decodes data from workers 
 * 4. Tracks jobs - visualisizes the current load
 * 5. Takes part in sequences signalling when one job is complete. 
 */
class WorkerCoordinator 
{ 
  static kWebWorkerFolder = "webWorkers/";
  constructor(workerScript, numberOfWorkers = 1) 
  {
    this.workers = [];
    this.nextFreeWorker = 0 ; 
    this.numberOfMessagesBeginProcessed = 0 ; 
    this.totaMessagesBeingProcessed = 0 ; 
    this.time_indicator = 0 ; 

    // Initialize the requested number of workers
    for (let i = 0; i < numberOfWorkers; i++) {
      const worker = new Worker(workerScript, { type: 'module' });//
      worker.onmessage = this.handleMessage.bind(this, i); // Identify the worker by index
      this.workers.push(worker);
    }
  }
  //. . . . . . . . . . . . . . . . . . . . .
  get numberOfWorkers()
  { 
    return this.workers.length ; 
  }
  //. . . . . . . . . . . . . . . . . . . . .
  tellTheNextFreeWorkerTo( data )
  { 
    const workerIndex = this.nextFreeWorker % this.workers.length;
    this.nextFreeWorker += 1; 
    this.postMessageToWorker( workerIndex , data  ); 
  }
  //. . . . . . . . . . . . . . . . . . . . .
  // Send a message to a specific worker
  postMessageToWorker(workerIndex, data) 
  {
    this.numberOfMessagesBeginProcessed += 1; 
    this.totaMessagesBeingProcessed += 1 ; 
     
    if (this.workers[ workerIndex ]) {
      this.workers[ workerIndex ].postMessage(data);
    } else {
      console.error(`No worker at index ${workerIndex}`);
    }
  }
  //. . . . . . . . . . . . . . . . . . . . .
  // Send a message to all workers
  postMessageToAll(data) {
    for (const worker of this.workers) 
    {
     // this.numberOfMessagesBeginProcessed += 1; 
     // this.totaMessagesBeingProcessed += 1 ; 
      worker.postMessage(data);
    }
  }
  //. . . . . . . . . . . . . . . . . . . . .
  postMessageToAll_TellMeWhenDone(data) {
    for (const worker of this.workers) 
    {
      this.numberOfMessagesBeginProcessed += 1; 
      this.totaMessagesBeingProcessed += 1 ; 
      worker.postMessage(data);
    }
  }
  //. . . . . . . . . . . . . . . . . . . . .
  processingComplete()
  { 
    console.info("Coordinator:: ALL processing complete."); 
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  // Handle incoming messages from any worker
  handleMessage(workerIndex, event) {
    this.numberOfMessagesBeginProcessed -= 1; 
    this.processMessageFromWorker(workerIndex, event.data  ); 
    if(  this.numberOfMessagesBeginProcessed== 0 )
    {
      this.processingComplete( ); 
    }
  }
  //. . . . . . . . . . . . . . . . . . . . .
  /** This allows subclasses to recive messages  */
  processMessageFromWorker( workerIndex, data )
  { 
    console.log(`Message from worker ${workerIndex}:`, data);
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  handleError( workerIndex, error )
  { 
    console.log(`Message from worker ${workerIndex}:`, error);
  }
  //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
  // Terminate a specific worker
  terminateWorker(workerIndex) 
  {
    if (this.workers[workerIndex])
    {
      this.workers[workerIndex].terminate();
      this.workers[workerIndex] = null;
    } else {
      console.error(`No worker at index ${workerIndex} to terminate`);
    }
  }
  //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
  // Terminate all workers
  terminateAllWorkers() 
  {
    for (const worker of this.workers) {
      if (worker) worker.terminate();
    }
    this.workers = [];
  }
  //. . . . .. . . . .. . . . .. . . . .. . . . .. . . . .. . . . . 
  drawIndicator( stage, current, maxval)
  { 
    if( maxval == 0 ) maxval = 1 ;
    const r =  ((height/2) -150) +  (stage * 20)  ; 
    let angle =   current * (2 * PI) / maxval ; 
    noFill(); 
    arc( width/2, height/2, r, r,  angle ,0  );
  }
  //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
  // // e
   drawCurrentStaus()
   { 
    if(this.numberOfMessagesBeginProcessed == 0 )return ;

    this.drawIndicator( 6,this.numberOfMessagesBeginProcessed , 
      this.totaMessagesBeingProcessed );
    
    const stage = 7 ; 
    const r =  ((height/2) -150) +  (stage * 20)  ; 
    
    noFill();
    stroke( pallet[ 3 ] ) ; 
    this.time_indicator +=  (2*PI)/220; 
    let next  =  this.time_indicator + ((2*PI)/60)*6;
    arc( width/2, height/2, r, r,  this.time_indicator , next  );
    /*line( 10, 20, 
        map(this.numberOfMessagesBeginProcessed  , 
          0 , 
          this.totaMessagesBeingProcessed, 
         20, width - 40 ),
          20);*/ 
   }

}
//===============================END OF CLASS=============================  







//-------------------------------------------------------------------------
/**
 * Sample constuct 
 *  let controller = new IsovistGeometryController( number of Processors , [ "script.js" ])
 */
class IsovistGeometryController2 extends WorkerCoordinator
{ 
  constructor( list_of_buildings ,  bounding_poly ,  numberOfWorkers = 1  , workerScript = null )
  { 
    console.assert(Number.isInteger(numberOfWorkers), 'First arg us number of workers');
    console.assert(  list_of_buildings !=null , "Internal Error 1680"); 
    console.assert( Array.isArray( list_of_buildings ), 'Internal error 1681'); 
    console.assert(  bounding_poly !=null, ' internal dev 1682' ); 

   if( workerScript == null )
   { 
    workerScript = kWebWorkerFolder + "isovistFinderWorker.js" ; 
   }

   super(  workerScript,numberOfWorkers );
   const processFrame = 
   { 
       messageID: 1 , 
       buildings: list_of_buildings  , 
       boundingBox: bounding_poly 
   };
   this.all_isovists_centers_generated = false ;
   this.bulkIsovistsProcessing = false ; 
   this.bulk_IsovistIntersections= false ; 
   this._isovists_NOT_transfered = true ; 
   this.postMessageToAll(processFrame ); 
  }
  //. . . . . . . . . . . . . . . . .
  /**
   * only draw process ring if doing build processing. 
   */
  drawCurrentStaus()
  { 
    text(" bulk = "+ bulkIsovistsProcessing , 20,20); 
    if( this.bulkIsovistsProcessing == true ){super.drawCurrentStaus();  }

  }
  //. . . . . . . . . . . . . . . . .
  /* 
      This assumes the building geometrty has been uploaded. 
      asks for a single isovist to be generated. 
  */ 
  makeIsovistFrom( hoz, vert  , radius = 88, isoID = -1 )
  { 
    const processFrame = 
    { 
        messageID: 2 , 
        xCoord : hoz ,
        yCoord : vert ,
        maxRadius : radius  , 
        //degreesPerSegment: 2 
        isovistID : isoID  // this is 
    };
    this.tellTheNextFreeWorkerTo( processFrame);
  }
  //. . . . . . . . . . . . . . . . .
  makeAllIsovistsFrom( allisovists)
  { 
    this.bulkIsovistsProcessing = true  ; 
    console.log(" START makeAllIsovistsFrom " ); 
    for( let idx in allisovists )
    { 
        const isovist = allisovists[ idx ];
        this.makeIsovistFrom( isovist.x, isovist.y ,  gMaxIsovistRadius, idx  );
    }   
    console.log(" makeIsovistFrom end ") ; 
  }
   //. . . . . . . . . . . . . . . . .
   // OVERRIDE 
  processingComplete()
  { 
    if(   this._isovists_NOT_transfered == true )
    { 
      this._isovists_NOT_transfered = false ; 
      console.log("Isovists are transfered OK "); 
      return ; 
    }
    if( this.bulkIsovistsProcessing == true ) 
    {
      this.bulkIsovistsProcessing = false  ; 
      
      processCompleteOK( 'End computeAllIsovistsFast 2' );
      return ; 
    }
    if(  this.bulk_IsovistIntersections==true )
    {
      this.bulk_IsovistIntersections = false ; 
      console.log("--NEED TO DELETE ALL WORKERS--");
      console.timeEnd("PIC");
      processCompleteOK( 'doAllIsovist', null  );
      
      return ; 
    }
    console.log("-- something else -- "); 
  }
   //. . . . . . . . . . . . . . . . .
   /**
    * @see reciveConnection for return from worker.
    * 
    * @param {*} allIsovists 
    * @returns 
    */
  doIsovistIntersections(  allIsovists ) 
  {
      //console.time("PIC");
      console.assert("Cntrl doIsovistIntersections "); 
      console.assert( allIsovists!=null , ' dev error 1716'); 
      console.assert( Array.isArray( allIsovists), 'int dev error 1717'); 
      let idx = 0 ; 
      this.bulk_IsovistIntersections= true  ; 

      // 1. need to construct list of all isovist centers. 
      let listOfIsovistCenters = [ ] ; 
      // We should just send the list once. 
      for( idx in allIsovists )
        { 
          const isovist = allIsovists[ idx ]; 
        
          listOfIsovistCenters.push( 
            { 
              x: isovist.x  , 
              y: isovist.y , 
              index: idx 
            }
          )
        }// end for 

      for( idx in this.allIsovists )
      { 
        const isovist = this.allIsovists[ idx ]; 
    
        if( isovist == null || isovist.isovistPolygon == null )
        { 
          window.alert("No polygon for isovist did you wait for them to intersected? " + idx ); 
          return ; 
        }
        const processFrame3 = 
        { 
            messageID: 3 , 
            xCoord : isovist.hoz ,
            yCoord : isovist.vert ,
            isovistID : idx  , // this is who to put the list of connections back to. 
            isovistOutline :  isovist.isovistPolygon ,
            isovistCentersToCheck: listOfIsovistCenters 
        };
        this.tellTheNextFreeWorkerTo( processFrame3 ); 
      }
  }
  //. . . . . . . . . . . . . . . . .
  // @ copy messageRecivedFromIsovst_FINDER_Worker 

  processMessageFromWorker( workerIndex, info )
  { 
    console.assert( isValidNumber(info.messageID ) , "messageID not a number ");
    //console.log(`Message from worker  IsovistGeometryController ${workerIndex}: ${info.messageID}` );
    if(   info.messageID == 3  )
    { 
      this.reciveConnection( info ); 
      return ; 
    }
    console.assert(  info.messageID == 2 , "don't understand message" ) ; 
    
      //isoID 
    if( info.isovistID == -1 )// 
    { 
      gMouseIovist = info.isovist ; 
      //updateOutput(" Iosvist arrived.");
      return ; 
    }
    if( info.isovistID == -2 )
    { 
      gSecondMouseIsoVist = info.isovist ; 
      updateOutput(" Iosivst second .");
      return ; 
    }
    this.reciveBulkIsovistsAreaCalcs(  info ); 
    return ;
  } 
  //. . . . . . . . . . . . . . . . .
  //
   //  let result = 
    //{ 
     // messageID: processMessage.messageID , //3 
     // isovistID: processMessage.isovistID , 
     // pointsInside_isovist : insidepoints 
    //}; 
  
  // METHOD 
 reciveConnection( info )
  { 
    //print("RECIVED BY The CONTROLLER CLASS ") ;
    console.assert( info.isovistID < this.allIsovists.length , "Isovist index error 944");
    console.assert( Array.isArray(  info.pointsInside_isovist), "expeected array 833"); 

    let target = gAllIsovists[ info.isovistID ] ; 
    for( let pt of info.pointsInside_isovist  )
    {
      console.assert(  pt.index !== undefined, "Index is not an numbrer " +  pt.index); 
      console.assert( pt.index>= 0, "Index is not an inde 889");
      console.assert( pt.index  < gAllIsovists.length , "Isovist index error 888");
      const ix = pt.index; 
      const other = gAllIsovists[ pt.index  ]; 
     
      target.connectTo( other ); 
      other.connectTo( target ); // For sake of redundancy 
      //print("Connect to ",info.isovistID , "  ", pt.index , " ", target.connectionCount() );
      //todo go to iso 
    } 
  }
    //I THINK WE NEED TO SPLLIT THIS UP INTO 2 SEPERATE CONTROLLERS.
 
   //. . . . . . . . . . . . . . . . .
   reciveBulkIsovistsAreaCalcs( info )
   { 
    //console.log("Recived return  "+info.messageID+ "reciveBulkIsovistsAreaCalcs ");
    if( ( gAllIsovists != null)  & 
        ( info.isovistID  !== undefined ) && 
        info.isovistID >= 0 )
    { 
      console.assert( info.isovistID < gAllIsovists.length , "Insovist inde error");
     // console.log(  info.isovistID + ' 😀 ' +  info.isovist.length )
      let targetIsovist  = gAllIsovists[ info.isovistID ]; 

      targetIsovist.isovistRays    = info.isovist ;
      targetIsovist.area           = info.area ; 
      //if(   !Number.isFinite( info.area  ) ) {  console.log( "A=", info.area  );  }
      targetIsovist.perimeter      = info.perimeter ?? Number.NaN ;
      targetIsovist.areaPerimRatio = info.areaPerimRatio ?? Number.NaN;
      targetIsovist.minRadial      = info.minRadial ?? Number.NaN ; 
      targetIsovist.averageRadial  = info.targetIsovist ?? Number.NaN;
      targetIsovist.maxRadial      = info.maxRadial ?? Number.NaN;
      targetIsovist.driftMagnitude = info.driftMagnitude ?? Number.NaN; 
      //-console.info(`Set ${targetIsovist.driftMagnitude}`);
   }
  }
  //. . . . . . . . . . . . . . . . .
} /// END OF CLASS 
//===============================END OF CLASS=============================  

/**
 *  class areaOfOverlapController
 * 
 * 
 *   made in doAreaOfOverlap_Intersections or processAllAreaOfOverlapCalcsforIsovists 
 *  
 * processAreaOfOverlapfor 
 * 
 *  see var gAreaOfOverlapController
 */
class AreaOfOverlapController extends WorkerCoordinator
{ 
  static  kMAX_CALCULATIONS_SIMULTANOIUSLY_601 = 601 ; 
  //. . . . . . . . . . . . . . . . . . . . . 
  constructor( numberOfWorkers = 1) 
  {
    super(  WorkerCoordinator.kWebWorkerFolder+ 'areaOver.js', numberOfWorkers ); 
    console.log( "new area of overlap controler ");
    this.allIsovists = null ; 
    this.doing_doAreaOfOverlapIntergration = false ; 
    //  this._numberOfAreaOverlap_calculationsInProgress = 0 ;
    this.isRunning = false;
    this.intervalId = null;// normally. 
    this.gNumberOfAreaOverlap_calculationsInProgress = 0 ; 
    this.gPeek_gNumberOfAreaOverlap_calculationsInProgress = 0 ; 
    this.currentIsoivst_toArea_Process = 0 ; 
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  get numberOfAreaOverlap_calculationsInProgress()
  {
    return this.gNumberOfAreaOverlap_calculationsInProgress;  
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  get isRunningInBackgrond()
  { 
    return this.isRunning ; 
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  /* OVERRIDE */ 
  drawCurrentStaus()
  { 
    strokeWeight(5); 
    line( 5, 20,  gAreaOverLp_Cntrlr.numberOfAreaOverlap_calculationsInProgress / 3   , 20 ); 
    this.drawIndicator( 4 , gAreaOverLp_Cntrlr.numberOfAreaOverlap_calculationsInProgress,
      AreaOfOverlapController.kMAX_CALCULATIONS_SIMULTANOIUSLY_601);
      
    noStroke( ); 
    fill( 255 ); 
    textAlign(CENTER, CENTER);
    textSize(32);
    
    text("D="+gAreaOverLp_Cntrlr.numberOfAreaOverlap_calculationsInProgress 
      + " " + this.currentIsoivst_toArea_Process 
      +  " " +  this.allIsovists.length , width/2, height/2 ); 
    textAlign(LEFT, BASELINE);
    textSize(16);
    stroke( pallet[1]); 
    super.drawCurrentStaus() ; 
    stroke( pallet[0]); 

    this.drawIndicator(6 ,this.currentIsoivst_toArea_Process, this.allIsovists.length );
  }
  /*
 gISOVIST_DRAW_CONFIG.topHoz = topH ;
  gISOVIST_DRAW_CONFIG.topVert = topV; 
  gISOVIST_DRAW_CONFIG.bottomV = bottomV ; 
  gISOVIST_DRAW_CONFIG.bottomH = bottomH ; 

drawFullIsovist 
  */ 
  //. . . . . . . . . . . . . . . . . . . . . 
  runAreaOfOverlapInBackground( _allIsovists )
  { 
    console.log(' runAreaOfOverlapInBackground ');
    console.assert( _allIsovists!= null ,'no null args' ); 
    console.assert(  Array.isArray( _allIsovists), 'arg is array of isovists'); 
    this.allIsovists = _allIsovists ; 
    this.currentIsoivst_toArea_Process = 0 ; 

    if (this.isRunning) return; // Prevent starting if already running

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.process(); // Call the internal process method
    }, 1000 / 50); // 60 times per second
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  stop()
  { 
    if (!this.isRunning) return; // Prevent stopping if not running
    clearInterval(this.intervalId);
    this.isRunning = false;
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  process()
  { 
    // this.currentIsoivst_toArea_Process 
    //... console.log("Process.", this.gNumberOfAreaOverlap_calculationsInProgress  ,  kMAX_CALCULATIONS_SIMULTANOIUSLY_601 ); 
    if(this.gNumberOfAreaOverlap_calculationsInProgress > 
      kMAX_CALCULATIONS_SIMULTANOIUSLY_601 )
      { 
        //console.log("FULL:"+ this.gNumberOfAreaOverlap_calculationsInProgress);
      }
    if( this.gNumberOfAreaOverlap_calculationsInProgress < 10 ) 
    { 
       //console.log("Empty:" + this.gNumberOfAreaOverlap_calculationsInProgress); 
    }
    // fill up the pipeline agains. 
    while( this.gNumberOfAreaOverlap_calculationsInProgress < 
            kMAX_CALCULATIONS_SIMULTANOIUSLY_601 )
      { 
        //console.log(this.currentIsoivst_toArea_Process , this.allIsovists.length  ); 
        if( this.currentIsoivst_toArea_Process  < this.allIsovists.length  ) 
        {
          this.doAreaOfOverlapFor(this.currentIsoivst_toArea_Process, this.allIsovists );
          this.currentIsoivst_toArea_Process += 1 ; 
        }
        else{ 
          this.gDoing_doAreaOfOverlapIntergration = false ; 
          console.log('Area of Overlap graph complete.');
          this.stop();// stop the auto repeat.  Don't add any more to que. 
          return ; 
        }
      }//cursor(ARROW);  
  }
  //. . . . . . . . . . . . . . . . . . . . .
  /** this gets many fake endings.
   *  Fixed bug where had the next process starting before this completed. 
   *  
   * */ 
  processingComplete()
  { 
    // this can be called if the que is empty so we check process done. 
    if(  this.gDoing_doAreaOfOverlapIntergration == false)
    {
    console.info("Coordinator:: ALL processing complete( THIS IS TRUE)"); 
    
    processCompleteOK('Area of Overlap Finished' ); 
    }
  }
  //. . . . . . . . . . . . . . . . . . . . . 
  processAllAreaOfOverlapCalcsforIsovists( isovistTocheck , allIsovists)
  { 
    console.log( 'isovistTocheck ==' , typeof isovistTocheck); 
    // assertions 
    this.allIsovists =  allIsovists; 
    console.assert(isovistTocheck!=null , 'No null args'); 
    console.assert(   isovistTocheck instanceof Isovist , ' not an isovist ' 
                +(typeof  isovistTocheck)  );
    //DEBUG isovistTocheck.selected = true ; 
    // Algorithum 
    const isovistA_ID = isovistTocheck.ID ; 
    // for each connection of this isovist launch area of overlap.

    let connections = isovistTocheck.getAllConnections();
    
    console.assert(Array.isArray( connections ), 'not getting an array');
    for( let con_isovist of  connections )
    { 
        const isoTooID = con_isovist.ID ; 
        console.assert( isovistA_ID != isoTooID , ` self link??? ${isovistA_ID} != ${isoTooID}` ); 
        console.assert( isovistA_ID>=0  , 'No negative IDs');
        
        this._processAreaOfOverlapfor(isovistA_ID , isoTooID ); 
    }
    console.log( 'DONE processAllAreaOfOverlapCalcsforIsovists '); 
  }
//. . . . . . . . . . . . . . . . . . . . . 
doAreaOfOverlapFor(  isovistA_ID ,  allIsovists )
{ 
  //console.log( 'ctrlr::doAreaOfOverlapFor ' + isovistA_ID ); 
  // PRE conditions 
  console.assert( allIsovists !=null ,  ' no null args'); 
  console.assert( Array.isArray( allIsovists ),' no null args '); 
  console.assert( Number.isInteger(isovistA_ID ) , "Isovist-" ); 
  // Algorithum 
  this.allIsovists =  allIsovists; 
  //const isovistA_ID = 20; 
  let isovistA = this.allIsovists[ isovistA_ID ]; 
  console.assert( isovistA != null , " 450 - "); 
  //console.log(` Controller doAreaOfOverlapIntergration ${ isovistA.ID } `); 
 
  let connections = isovistA.getAllConnections();
  console.assert(Array.isArray( connections ), 'not getting an array');
  for( let con_isovist of  connections )
  { 
    const isoTooID = con_isovist.ID ;  
    this._processAreaOfOverlapfor( isovistA_ID , isoTooID  );
    isovistA.selected = true; 
  }
  //console.log( 'DONE ctrlr::doAreaOfOverlapFor '); 
}

//--------------------------------------------------------------------
/**
New plan. 
The areaMessage is both the info going in and comining out. 
in future server can add exta iinfo and get it back 

NOTE restrict intersections to only those thigns which interconnet in the binary graph.
@see area_of_overlap_worker_return_TO_DELETE for response. 
*/
 _processAreaOfOverlapfor( isovist_a_ID ,  connectedIsovists_b_ID )
{ 
  //console.log(`Do area of overlap intergration; ${isovist_a_ID} , ${connectedIsovists_b_ID}`); 
 // let worker = getNextFreeAreaOfOverLapWORKER(); 
// invariants.
  //console.assert( worker!=null , "getNextFreeAreaOfOverLapWORKER error   " ) ; 
  console.assert( this.allIsovists !=null && this.allIsovists.length > 0 , "No isivsts no Area")
  console.assert( isovist_a_ID >= 0  , "out of bounds #3239");
  console.assert( isovist_a_ID <  this.allIsovists.length , "out of bounds 3239"); 
  console.assert( connectedIsovists_b_ID>= 0 ,  "out of bounds 3264"); 
  console.assert( connectedIsovists_b_ID < this.allIsovists.length , "out of bounds 3247"); 

// algorthum 
  let isovistA = this.allIsovists[ isovist_a_ID ]; 
  console.assert( isovistA != null , " 3242 - "); 
  let isovistA_Polygon = isovistA.isovistPolygon ; 

  let isovistB = this.allIsovists[  connectedIsovists_b_ID ]; 
  let isovistB_Polygon = isovistB.isovistPolygon ; 
// debug 
  //console.log(" sending worker message "); 
  //isovistA.selected = true ; 
  //isovistB.selected = true ;
// algorthum
  let areaMessage = 
  { 
     message: 42 , 
     messageCheck: 'AreaOfOverlap', 
     polygon_A_ID : isovist_a_ID , 
     polygon_A_centroid  : isovistA.center, 
     polygonA : isovistA_Polygon , 
     polygon_B_ID : connectedIsovists_b_ID , 
     polygon_B_centroid: isovistB.center , 
     polygonB : isovistB_Polygon , 
     workerIndex: 0 , 
     
     areaOfA: 0 ,  // result 
     areaOfB: 0 , // result 
     unionArea: 0 , // result 
     intersectionArea: 0 ,  // result 
     jaccardFraction: 0 , // result 
     asymetricAreaOfOverlapFraction:0 , // result 

  };
  this.gNumberOfAreaOverlap_calculationsInProgress += 1 ; 
  if( this.gNumberOfAreaOverlap_calculationsInProgress > this.gPeek_gNumberOfAreaOverlap_calculationsInProgress )
  { 
      this.gPeek_gNumberOfAreaOverlap_calculationsInProgress = this.gNumberOfAreaOverlap_calculationsInProgress; 
  }

  this.tellTheNextFreeWorkerTo( areaMessage ); 
  // WAS worker.postMessage( areaMessage  );
  // see area_of_overlap_worker_return for result
  //print("Area - workers posted. ") ;
}
  //. . . . . . . . . . . . . . . . . . . . . 
  // Handle incoming messages from any worker
  processMessageFromWorker(workerIndex, info) 
  {
    console.assert( info!=null , " area_of_overlap_worker_return :: reutrn "); 
    console.assert( info.message == 42 , ' Message check wrong ') ; 
    console.assert( info.messageCheck == 'AreaOfOverlap', 'Message check failure'); 
    console.assert(  this.allIsovists.length > 0 , "Inot enough isovists"); 

    //console.log(`areaOfA  ${info.areaOfA.toFixed(1)} , areaOfB ${info.areaOfB.toFixed(1)} `);
    //console.log(`Union Area ${info.unionArea.toFixed(1)}`); 
    //console.log(`Intersection ${info.intersectionArea.toFixed(1)}`); 
    //console.log(`ID-A ${info.polygon_A_ID}`); 
    //console.log(`ID-B ${info.polygon_B_ID}`); 
    console.assert( Number.isInteger( info.polygon_A_ID), ' Poly '); 
    // VARS 
    const isovistA   = this.allIsovists[info.polygon_A_ID]; 
    const tooIsoivst = this.allIsovists[info.polygon_B_ID]; 

    console.assert( isovistA   != null, 'Internal worker communcation'); 
    console.assert( tooIsoivst != null , 'Internal com error'); 

    console.assert( info.unionArea > 0.0 , 'Union area cannot be null ' ); 

    let weight =  info.asymetricAreaOfOverlapFraction ; // info.intersectionArea / info.unionArea; 
    console.assert(  weight >= 0.0 , `Impossoble weight ${info.intersectionArea} , ${ info.unionArea }` ); 
    console.assert( weight <= 1.000001 , `Impossoble weight-2 ${info.intersectionArea} , ${ info.unionArea }`); 
    if(  weight > 1.0 ) { weight = 1.0; } //trim minor decimal palces.
    //- print(`${weight.toFixed(3)}  info.intersectionArea / info.unionArea Is wrong check paper `); 

    //gNumberOfAreaOverlap_calculationsInProgress -= 1 ; 
    this.gNumberOfAreaOverlap_calculationsInProgress -= 1 ; 
    isovistA.setConnectedWeightForIsoist( tooIsoivst, weight );
    // If zero then complete. 
    //if( gNumberOfAreaOverlap_calculationsInProgress == 0    )// CAN BE WRONG..
    //{ 
      // &&  gDoing_doAreaOfOverlapIntergration == false 
    // console.log("Area Overlap PROCESSING COMPLETE "); 
    //}

    //super.handleMessage( workerIndex, event ); // handles all the super stuff.

  }
  //. . . . . . . . . . . . . . . . . . . . . 
  /*doAreaOfOverlapFor( allIsovists , isovistA_ID )
  { 
    console.assert( Number.isInteger(isovistA_ID ) , "Isovist-" ); 
    let isovistA = allIsovists[ isovistA_ID ]; 
    this.allIsovists  = allIsovists ; // keep for later. 
    this.processAllAreaOfOverlapCalcsforIsovists( isovistA ); 
  }
    */ 
  //. . . . . . . . . . . . . . . . . . . . .



}

//============================================================
class StepDepthController extends WorkerCoordinator
{ 
  constructor( numberOfWorkers = 1  )
  { 
    super( kWebWorkerFolder+"stepDepthWorker.js" , numberOfWorkers)
    console.log("|| StepDepthController || ");
    this._allIsovists = null ; 
    this._theGraphsAreLoaded = false ; 
    this._processingTotalDepth = false ;
    this._processing_Step_depth = false ; 
    this._graph_is_disconnected_WARNING = false ; 
  } 
 //. . . . . . . . . . . . . . . . . . . . .
 /**
  *  @see processMessageFromWorker  
  * @param {*} allIsovists 
  */
  sendGraphToWorkers(  allIsovists )
  { 
    console.log(' send grapht workers '); 
    // pre conditions 
     console.assert( allIsovists!=null , 'no null args '); 
     console.assert( Array.isArray( allIsovists ), ' expected array') ; 
     console.assert( allIsovists.length > 2 , ' Array too small ');
    // Algorithum 
     this._allIsovists =  allIsovists; // keep referance so we can recive 
     const the_graph = this.convertIsovistsToJSON_Graph( allIsovists);
     this._graph_is_disconnected_WARNING = true  ;// reset warnings.
     //@@@ CHECK ALL IS OK. 
    let graph_worker_setup_message = 
   {
      message: 'LOAD_GRAPH', 
      messageID : 1  ,
      workerID : 0 , // which processor are you. NOT USED? 
      messageCheck : 0xCAFEBABE,
      graph:  the_graph 
   };
   this.postMessageToAll_TellMeWhenDone(graph_worker_setup_message ); 
   this._theGraphsAreLoaded = true ; 
   this._graph_is_disconnected_WARNING= false ; // wait 
   console.log(` started  ${ this.numberOfMessagesBeginProcessed} `); 
    
  }
  //. . . . . . . . . . . . . . . . . . . . .
  /**
   * converts the intersected isovist list to a list of 
   * nodes in format 
   *  let newNode = 
          { 
            nodeID: idx , 
            edges: edgeList   // list if numbers [ 1,4,3,9,5,11 ]
          }; 

   * @param {*} allIsovists 
   * @returns 
   */
  convertIsovistsToJSON_Graph(allIsovists )
  { 
     console.assert( allIsovists!=null , 'no null args '); 
     console.assert( Array.isArray( allIsovists ), ' expected array') ; 
     console.assert( allIsovists.length > 2 , ' Array too small '); 

     for(  let idx in allIsovists )
      { 
            const isovist = gAllIsovists[ idx ]; 
            isovist.ID = Number(idx) ;// force tro be numer 
      } 
      // convert list if isovists to one which can be transmitted as JSON. 
      let the_graph = [ ] ;

      for( let idx in allIsovists )
      { 
        const isovist = gAllIsovists[ idx ]; 
        console.assert( isovist instanceof Isovist , "Not isoivst in gAllIsovists" ); 
        
        const isovistEdges = isovist.getAllConnections();
        console.assert( Array.isArray(isovistEdges  ), 'All connections not list'); 
        let edgeList = [ ] ; 
        let numberDuplicateOfEdges = 0 ; 
        let numberOfNonIntegers = 0 ; 

        for( const node of isovistEdges)
          { 
            if( !Number.isInteger( node.ID   )) numberOfNonIntegers += 1 ; 
            if(  node.ID  ==  isovist.ID ) continue ; // remove link to self. 
            if( node.ID in edgeList   )
            {  numberDuplicateOfEdges += 1 ; 
            }else  
               edgeList.push(node.ID); 
          }
          if( edgeList.length == 0 ||  isovistEdges.length == 0  )
          { 
            isovist.select = true ; 
          }
          console.assert( numberOfNonIntegers == 0 , "Isovist format errors" ); 
         //ß console.assert(  numberDuplicateOfEdges == 0 , "Non set opertion for edge lists" ); // this fires.
          //console.log(`not int= ${numberOfNonIntegers}, dups = ${numberDuplicateOfEdges}`);
          let newNode = 
          { 
            nodeID: idx , 
            edges: edgeList   // list if numbers [ 1,4,3,9,5,11 ]
          }; 
          the_graph.push( newNode ) ;
      }// end for all isovists
  //post condition 
      console.assert( the_graph !=null , '794'); 
      console.assert( the_graph.length ==  allIsovists.length , '795'); 

      return the_graph ; 
  }
  //. . . . . . . . . . . . . . . . . . . . .
  /**
   * 
   * @param {*} workerIndex 
   * @param {*} data 
   */
  processMessageFromWorker( workerIndex, message  )
  { 
    console.assert( message !=null , "No response in message recived. ")
   //const message = e.data ; 
  
  if( message.messageID == 400 ) 
  { 
     //print("OK from webworker - sending process to test"); 
    //console.log(` complete ${ this.numberOfMessagesBeginProcessed} `); 
    console.assert( message.messageCheck == 0xBADFACE , "Format of message incorred") ; 
    this._theGraphsAreLoaded  = true ; 

    return ; 
  }
  // 100 is the message to return the step depths. 
  if( message.messageID == 100 ) 
  { 
    this.stepDepthRecived( message);
    return ; 
  }
  if( message.messageID == 101 )
  { 
    this.totalDepthRecived( message ); 
    return ; 
  }
  console.error("Don't understand message from graph worker  822");

  }
  //. . . . . . . . . . . . . . . . . . . . .
  doTotalDepthFrom( index ) 
  { 
    //console.log(" Do  Total depth from ", index ); 
      console.assert( this._theGraphsAreLoaded  == true, 'Graphs are not loaded' ); 
      console.assert( Number.isInteger(index ), ' must past an isoivst index '+ index ); 

      console.assert( index >= 0 , "Index of node cannot be negative"); 
  
      this._processingTotalDepth = true  ;
      const  graph_worker_do_step_depth_from_task  = 
      { 
          message: 'TOTAL' ,  // must match 2 below. redundant check.
          messageID: 3 , 
          messageCheck : 0xCAFEBABE , 
          nodeToProcess:index , 
      }; 
      this.tellTheNextFreeWorkerTo(graph_worker_do_step_depth_from_task );
  }
  //. . . . . . . . . . . . . . . . . . . . .
  /**
   *  this is called when a total depth response is recived. 
   * @param { } message 
   */
  totalDepthRecived( message  )
 { 
    //console.assert( message.nodeToProcess == 0 , "Bad retyrn on graph worker"); 
    console.assert( message.messageID == 101, "totalDepthRecived 856 ?"); 
   
    const resultTable  = message.resultDepthTable;
    let idx = Number(message.nodeToProcess) ; 
    //console.log(" Target  = " , message.nodeToProcess ); 
    console.assert(  Number.isInteger(idx )); 
    let iso = this._allIsovists[ idx ]; 
    console.assert( iso != null &&  ( iso instanceof Isovist) ,"No source iso" ); 
   
    //console.log(" Is TYPE is istnace " + ( iso instanceof Isovist)  ); 
    console.assert( idx == iso.ID ,  `Node Id mixup ${idx} ${iso.ID} 866` ); 
    //console.log("total depth = ",  message.totalDepth ) ; 
    iso.currentValue   = Number( message.totalDepth ) ; 
    iso.totalStepDepth = Number( message.totalDepth ) ; 
    if( message.disconnected == true )
    { 
      if( this._graph_is_disconnected_WARNING == false )
      { 
        console.error('Graph is disconnected'); 
        annonceToUser( `The Graphics disconnected
          (solution slightly decrease grid spaceing?)
          FYI. The colours are meaningless` ); 
        //alert('The Graphics disconnected\n(solution decrease grid spaceing?)');
        this._graph_is_disconnected_WARNING = true  ;
      }
       
    }
      
  }
  //. . . . . . . . . . . . . . . . . . . . .
  /**  
   * the StepDepthController can compute all the depths from a starting point. 
   * @argument
   */
doStepDepthFrom( index )
{ 
  //console.log(" Do step depth from ", index ); 
// PRECONDITIONS 
  console.assert( Number.isInteger( index ) , 'argument must be index') ; 
  console.assert( index >= 0 , "Index of node cannot be negative"); 
  console.assert( this._theGraphsAreLoaded  == true, 'Graphs are not loaded' ); 
  
// ALGORITHUM 
this._processing_Step_depth=  true;  
  const  graph_worker_do_step_depth_from = 
  { 
      message: 'STEP DEPTH' ,  // must match 2 below. redundant check.
      messageID: 2 , 
      messageCheck : 0xCAFEBABE , 
      nodeToProcess:index , 
      
  }; 
  this._allIsovists[ index ].selected = true ; 
  this.tellTheNextFreeWorkerTo( graph_worker_do_step_depth_from); 
  this._graph_is_disconnected_WARNING = false ;
  //POST CONDITIONS - NON 
}
  //. . . . . . . . . . . . . . . . . . . . .
  /**
   * u - Generate_STOCASTIC_IsovsitInteractive
   * r - computeAllIsovistsFast 
   * ; - doIsovistIntersections 
   * t transferGraphToWorkers
   * 'D'  findStepDepthFromSelection
   * 
   * @param {anonymous object} message 
   */
  stepDepthRecived( message )
  { 
    // PRE CONDITONS 
     print("--Message from set depth processing worker."); 
      //console.assert( message.nodeToProcess == 0 , "Bad retyrn on graph worker"); 
    console.assert( message.messageID == 100, "stepDepthRecived 2718 ?"); 
    console.assert( this._processing_Step_depth== true , ' not processing step depth currently'); 
    console.assert( this._allIsovists!=null , ' never ' );
    // ALGORITHUM 
      const resultTable  = message.resultDepthTable;
      this._graph_is_disconnected_WARNING = false ;

      for(  let idx in this._allIsovists )
      { 
          let iso = this._allIsovists[ idx ]; 
          console.assert( idx == iso.ID ,  `Node Id mixup ${idx} ${iso.ID}` ); 
          //print(` Setting ${ iso.ID } to ${resultTable[ iso.ID ]} `); 
          if(resultTable[ iso.ID ] < Number.MAX_SAFE_INTEGER -10   )
          { 
             iso.currentValue = resultTable[ iso.ID ]; 
             iso.stepDepth = resultTable[ iso.ID ]; 
          } else{ 
            iso.currentValue = Number.NaN ; 
            iso.stepDepth    = Number.NaN ; 
            this._graph_is_disconnected_WARNING = true ;
          }
      }
      //colorByCurrentValue(); // global function but this side of the wall. 
    // POST CONDITONS 
     
  }// END OF METHOD 

  //. . . . . . . . . . . . . . . . . . . . .
  /**
   * called when all process complete from workers
   * 3 conditions 
   * 1. Graph transfer 
   * 2. Step depth (single )
   * 3. build total depth (single/multiple)
   * 
   * Calls externa function 
   * @returns nothing 
   */
  processingComplete() 
  { 
    
    if( this._processing_Step_depth== true )
    { 
      console.log("Process step depth complete "); 
      colorByCurrentValue(); // calls global function 
      gCurrentMeasure = 'Step (Topological) Depth';
      this._processing_Step_depth= false ; // just clear flag. 
      return ; 
    }

    // we need to have a mode now. 
    if(  this._processingTotalDepth == true  ) 
    { 
      console.log("SWC::Last total depth recived "); 
      this._processingTotalDepth = false ; // reset.
      colorByCurrentValue(); // calls global function 

      gCurrentMeasure = 'Topological Intergration'; 

      processCompleteOK(); // calls global function 
      
      return ; 
    }
    console.log(" STep Depth graph transfer complete " ); 


    processCompleteOK('Graphs Transfered to workers complete' );

  }
  

} 
//============================================================