'use strict';

const version = 0.91; // 13th Feb 
/* 

https://nedbatchelder.com/text/hexcolors.html - hex words to colors fun.  

TODO 

Save buildnigs in export including black and white. 

4. set denisity 
   make the desnist relatie to the size of the original 
   so make proportation ton 1024 * 800 pix by defausl. 
   draw dots to represent density when not set. 
5. Survey software so people can record their origin. 
    Use a online survey thing. 
6. Set isovist numbers ( via cull ) - done. 
4. Warn on disconnection 

6.3 zoom/pitch via multi touch. ( test on ipad )
7. 
8. First trial release (videos) - done 
8.5 Radius ( via Metric Distance )
9. Choice + Follow your nose choice 
10. buttons for mode - done. 
11. linking isovists ( needs selection )
12. Auto boundary. 

*/ 


/*
subtle 
#646E78
#8D98A7
#DCCCBB
#EAB464
#A7754D

Rth 
#E3B505
#E4572E
#29335C

#669BBC
#A7C4C2

// this is pallet color 
Ruth 
#E3B505
#95190C
#610345
#107E7D
#044B7F 

*/ 
/*
  Now isovists are computed externally remove all the dead code. 
  includes referances to the other things.

  2. Compute Intersections ( via web workers )
    This is is point in polygon connections. 
    PASS subset of the modle but all the isovst points. 

  3. Computer Area overlap ( via web workers )
    This will have to have the whole model ? 

  4. Compute Intergration ( va web workers )

  5. Compute Area intergration 

  5.5 - Export images ( some how )
  5.6 - possible to talk to clip board ? 

  6. Generate Table 
    6.1 Export 

  7. Generate Scattergram 
    7.1 ?Export ? 
// RELEASE.

  5. sort out grid generation. 

*/ 
// const {Point} = flatten;

// GLOBAL VARIABLES.

let outputDiv = null ;
// Zooming code. 
let fZoomFactor = 1.0; 
let fMaxZoom = 50.0; 
let fMinZoom = 1e-4; 
let fScrollFactor = 0; 
const fIncrement = 1.05;
const kVerticalSpacesing = 60; 
let fOffSetX = 0; 
let fOffSetY = 0; 
// User interface 
let gfileDropInProgress = false ; 
let gUserInput_MODAL_in_Progress = false;

let someLines = [  ] ; // bad name 
// let someSegments = [ ]; 
let gBuilding_polygons = [ ] ;// all buildings in polygon format 
let gBoundingBoxPoly = null ; 

let gBackgroundColor = null ;
let gSelectedIsovists = new Set() ; 
let gNumberOfProcessors = 8 ; // setable by users 

let gQuadTree = null ; // Global tree ( there is only one )

const  DP_TOL = 0.000001; 

let gMouseIovist = [ ] ; // an array of line segments 
let gSecondMouseIsoVist = [ ]; // an array of line segements. 

const pallet = 
[ 
  '#E3B505',
  '#95190C',
  '#610345',
  '#107E7D',
  '#044B7F' 
]; 

function makeALine(  HozStart, VertStart, HozEnd, VertEnd )
 {
  const it =   {
    fHozStart  : HozStart ,  
    fVertStart : VertStart,
    fHozEnd    : HozEnd,
    fVertEnd   : VertEnd 
  }; 
  return it; 
 }

const kBuildingFill = pallet[ 4]; 
const kIsovistColor = pallet[ 0 ]; 
const kIsovistColor2 = pallet[ 3 ]; 

// ----- DEBUG -----
let gDebug_TriA  = null; 
let gDebug_TriB  = null ; 
let gDebug_result = null ; 
//                      debug triangle intersection.
let gDebug_intersectr_Pts = [ ] ; 
let gDebug_cross_pts = [] ; 
//                        debug segment intersection 
let gSegmentCrossDebug = [ { x:10, y:10 }, { x:200,y:200}] ; 
let gSideMouseDebug = [  { x:100, y:10 }]; 
let gSideValue = ""; 

let gDebugIntersection= null; 
//                       debug insovist intersection for area.
let gSeg1 = null ; 
let gSeg2 = null ;
let gSegB1 = null ; 
let gSegB2 = null ;
let gInterSectZones =  [ ] ; 
//                      debug interection makeIsovistPolygonFromIsoRays
let gSegList = [] ; 
let gIsoVistPolygoVRD = null ; 
let gSecondIsovistVRDPolygon = null ; 

let gColorByIsColor = 0 ; // 0 - back/white 
let gAllIsovists = [ ] ; // Array of isovists -- this is the main datamodel. 

let gGridDensity = 5 ; 
let gFixedNumberOfIsovists = 0 ; // < 1 means not fixed. 

let lstMouseX = 0 ; 
let lstMouseY = 0 ; 
let gDisplayMessage = null ; 

// These are the controllers that talk to the 
const kWebWorkerFolder="webWorkers/"; 
let gStocastic_grid_generator_controller = null ; // instance of.  StocasticGridGeneratorControler 
let gRegulardGridGEneratorController = null ; 
let gAreaOverLp_Cntrlr = null ; 
let gStepDepthController = null ; 
let gFracIntergrationController = null ; 
let gIsovistGeometryController = null ; 

// Tools 
const kDRAG_AND_PAN    = 0 ; 
const kINFO            = 1; 
const kSELECTION       = 2; 
const kISOVIST_DROPPER = 3; 

let gCurrentTool = kDRAG_AND_PAN;

// shoudl this be part of isvoists ? 
let  gSHOW_FULL_ISOVIST = false  ; 
let  gSHOW_ISIVST_CONNECTIONS = false  ; 
let  gSHOW_ISOVISTS_DOT = true ; 


/*
https://github.com/alexbol99/flatten-js/blob/master/examples/browser/index.html
https://www.npmjs.com/package/@flatten-js/core
*/ 

// Compute the intersection of the two triangles

// Function that can be called from HTML
function updateOutput(message) {
  if( outputDiv != null )
  {
  outputDiv.html(message);
  }
  else 
  { 
   print(message ); 
  }
}
function isValidNumber(value) {
    return value !== undefined && value !== null && typeof value === 'number' && !isNaN(value);
  }

//---------------------------------------------------
// Tools 
/*const kDRAG_AND_PAN    = 0 ; 
const kINFO            = 1; 
const kSELECTION       = 2; 
const kISOVIST_DROPPER = 3; 

let gCurrentTool = kDRAG_AND_PAN;  */ 

function setCurrentTool( which )
{ 
  console.assert(Number.isInteger( which ) , 'arg needs to be a number from 0 to 3 ') ; 
  console.assert( which >= 0 , 'out of range '+ which ); 
  console.assert( which <= 3 , 'out of range ' + which ); 
  print('set tool to' + which ); 
  gCurrentTool = which ; 

}
//---------------------------------------------------
function getCurrentTool()
{ 
  return gCurrentTool; 
}
//---------------------------------------------------
function  startModalInputInProgress()
{ 
  console.log("Start modal"); 
  gUserInput_MODAL_in_Progress = true ; 
}
//---------------------------------------------------
function  endModalInputInProgress()
{ 
  console.log("end modal"); 
  gUserInput_MODAL_in_Progress = false  ; 
}
//--------------------------------------------------
function isModalInputInProgress() 
{ 
  return gUserInput_MODAL_in_Progress ; 
}

function askForGridSpacing() {
  const  currentFPS = frameRate();
  frameRate(0);
  startModalInputInProgress(); 
  let gridSpacing = prompt('Enter the grid spacing (smaller number means denser):',gGridDensity  );
  
  // Check if the input is a valid number
  let gridSpacingNum = parseFloat(gridSpacing);

  // Validate the input
  if (isNaN(gridSpacingNum) || gridSpacingNum <= 0) {
    // Show an alert if the input is not a valid number or is zero or less
    alert('Please enter a valid number greater than 0 for the grid spacing.');
  } else {
    gGridDensity = gridSpacingNum;
    // Proceed with the valid input
    updateOutput("Grid spacing " + gGridDensity );
  }
  frameRate(currentFPS);
  endModalInputInProgress();
}



//===================================================================



/**
 * #Isovist 
 *    targetIsovist.isovistRays = info.isovist ;
      targetIsovist.area = info.area??-1.0 ; 
      targetIsovist.perimeter = info.perimeter ?? Number.NaN ;
      targetIsovist.areaPerimRatio = info.areaPerimRatio ?? Number.NaN;
      targetIsovist.minRadial = info.minRadial ?? Number.NaN ; 
      targetIsovist.averageRadial = info.targetIsovist ?? Number.NaN;
      targetIsovist.maxRadial     = info.maxRadial ?? Number.NaN;
      targetIsovist.driftMagnitude = info.driftMagnitude ?? Number.NaN; 
      //console.info(`Set ${targetIsovist.perimeter}`); 

 */
class Isovist { 
  /**
   *  #isovist 
   * @param {} startPoint 
   * @param {can be null } arrayOfBoundsPoints 
   */
  static ISOVIST = 'isovist';
  static kCellRadius = 3; 
  
  constructor(  hozX , vertY    , arrayOfBoundsPoints = null )
  { 
    //console.assert(  startPoint instanceof  Point , " IsovistRay passed non Point" ); 
    this._center = { x: hozX , y: vertY }; 
    this.edgePolygon = arrayOfBoundsPoints; 
    this._currentValue = 0 ; 
    this._currentColor = color( 127,127, 127); // grey for error 
    this._connections = [ ] ; // perhaps shuold be a set ? 
    // Using map as the key is an isovist 
    // perhaps should store as Float32 Arrays 
    this._connectionWeight =  new Map() ; // Isovist-> weight
    this._totalDepth = -1 ; //Not seet yet.
    this._selected = false ;
    this._ID   = 0 ; 
    // Basic Isovist - 
    this.area           = 0.0 ; 
    this.perimeter      = 0.0 ;
    this.areaPerimRatio = 0.0;
    this.minRadial      = 0.0; 
    this.averageRadial  = 0.0;
    this.maxRadial      = 0.0;
    this.driftMagnitude = 0.0; 
    this.asymetricAreaTotalDepth = 0.0 ; 
    this.eigenCentrality = 0.0 ;// for eigen vector
    this._choice = 0.0 ; 
    this._asymetricChoiceAcumulator = 0.0 ; 
    this._stepDepth =0.0 ; /// temp distance to some target. 
  }
  /*
  get area
  get permieter 
  get areaPerimRatio 
  get circularity
  get driftMag
  get drifDirection (angle )
  get maxRadial
  get minRadial 
  get averageRadial 
  get connectivity() 
  get areaConnectivtiy()

  */ 
  get choice() 
  { 
    return this._choice; 
  }
  set choice( value ) 
  { 
    console.assert( Number.isFinite( value ), 'arg not number' + value );
    this._choice = value ; 
  }
  /**
   * This computes centrality. Assumes step depth set up correctly. 
   * 
   * @param {*} people 
   */
  doChoice( people , targetID , all  )
  { 
    console.assert(  Number.isFinite( people ), 'arg not number' + people );
    console.assert( people > 0.0 , ' empty passed to choice') ; 
    console.log( `ID ${this.ID} to ${targetID}`);
    if( this.ID == targetID ) return ; // reached home success. 
    console.log( `depth ${this.stepDepth} ${this.currentValue} `);// step depth 0 

    this.choice += people ; 
    this.currentValue = this.choice ; 
    let countOfLesserNodes =  0 ; 
    for( const node in this._connections)
    { 
      // node.setpDepth undefinedf 
  
      
      const nd = all[ node ]  ; 
      console.log( `  ${node} ${nd.stepDepth}  ${ nd.stepDepth < this.stepDepth} ${this.stepDepth} ${nd.currentValue} `);
      if( nd.stepDepth < this.stepDepth)
      { 
          countOfLesserNodes += 1 ; 
      }
    }
    console.log( ` choice count  ${countOfLesserNodes} `  ); 
    if(  countOfLesserNodes <= 0 ) return ; 
    let peopleFraction = people / countOfLesserNodes ; 

  }
  get stepDepth() 
  { 
    return this._stepDepth; 
  }
  set stepDepth( value  ) 
  { 
    console.assert( Number.isFinite( value ), 'arg not number' + value );
    this._stepDepth = value ; 
  }
  get asymetricAreaOverlapChoice() {
    return this._asymetricChoiceAcumulator;
  }
  
  set asymetricAreaOverlapChoice( value ) {
    this._asymetricChoiceAcumulator = value;
  }
  
  resetAsymetricAreaOverlapChoice() {
    this.asymetricAreaOverlapChoice = 0.0;
  }
  
  addToAsymetricAreaOverlapchoice( value ) {
    console.assert( Number.isFinite( value ), 'arg not number' + value );
    this.asymetricAreaOverlapChoice += value;
  }
//.........................
 get power()
 { 
  return this.eigenCentrality ; 
 }
 getEigenPower() 
 { 
  return this.eigenCentrality ; 
 } 
 setEigenPower( value ) 
 { 
  console.assert( Number.isFinite( value ), 'arg not number' + value); 
  this.eigenCentrality = value ; 
 }
   //.........................
 set power( value )
 { 
  console.assert( Number.isFinite( value ), 'arg not number' + value); 
  this.eigenCentrality = value ; 
 }
  //.........................
  get selected()
  { 
    return this._selected ; 
  }
  //.........................
  set selected( value )
  { 
    if( value )
      { this._selected  = true ; } 
    else 
    this._selected  = false ; 
  }
  //.........................
  get center()
  { 
    return this._center ; 
  }
  //.........................
  get x()
  { 
    return this._center.x; 
  }
  //.........................
  get y()
  { 
    return this._center.y 
  }
  //.........................
  get ID()
  { 
    return this._ID ; 
  }
  //.........................
  set ID( idx )
  { 
    this._ID = idx ; 
  }
  //. . . . . . . . . .  
  set totalStepDepth(  totalDepth )
  { 
    console.assert( Number.isInteger( totalDepth )); 
    this._totalDepth = totalDepth ; 
  }
  //.........................
  get totalStepDepth()
  { 
    return this._totalDepth ; 
  }
  //.........................
  /**
   * can return Nan or a numbv
   */
  get currentValue()
  { 
    return this._currentValue; 
  }
  //.........................
  set currentValue( val )
  { 
     this._currentValue = Number( val); // make sure is value.
  }
  //.........................
  resetInfo()
  { 
    this._connections = [ ] ; // perhaps shuold be a set ? 
    this._connectionWeight =  new Map() ; // Isovist-> weight
  }
  //.........................
  colorByCurrentValue( minVal, maxVal  , gColorByIsColor = 0 )
  { 
    console.assert( Number.isFinite ( minVal) , "minVal must be number +"+minVal );
    console.assert( Number.isFinite ( maxVal) , "maxVal must be number+"+maxVal );

    if( Number.isNaN(   this.currentValue)  || 
          this.currentValue < minVal ) 
    { 
      this._currentColor = color('magenta') ; 
      return ; 
    }
    if( this._currentValue > maxVal )
    {  
      this._currentColor = color('magenta') ; 
      return ;
    }
    const normalised = ( this.currentValue - minVal ) / (maxVal -minVal); 
    if( gColorByIsColor == 0 )
    {
      colorMode(HSB, 360, 100, 100);
      let c = color(260 * normalised, 99, 99);// too many ? 
      this._currentColor = c ; 
      colorMode(RGB, 256,256,256);
    } 
    else 
    { 
      colorMode(RGB, 256,256,256); 
      let c = color( 32+ (224 * normalised) ); 
      this._currentColor = c ; 
    }
  }
  //.........................
  /** this in in VRD format  */
  set isovistRays( arrayOfRays )
  { 
    console.assert( arrayOfRays != null , "No null arguments"); 
     let newPoly = [ ] ; 
     for( const seg of  arrayOfRays )
     { 
      console.assert( seg.pe !== undefined  , "Not defined " + JSON.stringify(seg)); 
      
      newPoly.push( seg.pe ); 
     }
     //console.log( JSON.stringify( newPoly[0]));
     console.assert( newPoly[0].x !== undefined , "Failed " + JSON.stringify(newPoly[0])); 
     this.edgePolygon =newPoly; 
  }
  //.........................
  hasIsovist()
  { 
      return this.edgePolygon != null ;
  }
  //.........................
  set isovistPolygon( newPoly)
  { 
    console.assert( Array.isArray (newPoly) , "Expected a polygon in VRD format" );
    console.assert ( newPoly.length> 3 , " Need at least 3 points to be polygon"); 
    console.assert(   newPoly[0].x !== undefined ,  "Expected a polygon in VRD format.=" + JSON.stringify(newPoly[0]) ) ;
    this.edgePolygon = newPoly ; 
  } 
  //.........................
  get isovistPolygon()
  { 
    return this.edgePolygon ; 
  }
  //.........................
  /**
   *  get isovist Ray useful if doing trigangle intersectons. 
   *  */
  get isovistRays()
  { 
    // convert to rays for 
    let newRays = [ ] ; 
    const cen = this.center; 
    for( const seg in arrayOfRays )
    { 
      newRays.push( { ps: cen  ,  pe: seg  } ); 
    }
     return newRays; 
  }
  //.........................
  connectTo(  IsovistOther ) 
  { 
    console.assert(IsovistOther instanceof Isovist , "connecting not to isovist ") ; 
    console.assert(this._connections   != null , "No cons :308");
    if(  IsovistOther== this)
    { 
         return; // skip self
      }  
    if(  IsovistOther  in  this._connections )
    {
    }else
    {
      this._connections.push( IsovistOther); 
    }
  }
  //.........................
  getAllConnections() 
  { 
    console.assert( Array.isArray( this._connections ), "getAllConnections not an array");
    return this._connections ; 
  }
  //.........................
  getNthConnection( n ) 
  { 
    console.assert( Number.isInteger( n  ), "N. need to get connection."); 
    if( this._connections  == null ) { return null ; }
    return  this._connections[ n ]; 
  }
  //.........................
  connectionCount()
  { 
    return this._connections.length ; 
  }
  //.........................
  get connectivity()
  { 
    return -this.connectionCount(); 
  }
  //.........................
  // Does the single itteration of a eigen vector itteration. 
  computePowers( isovistArray )
  { 
    let sum = 0.0 ; 
    for( let e in this._connections )
    { 
       let edge = isovistArray[ e ] ; 
       sum += edge.eigenCentrality ; 
    }
    return sum ; 
  }
  //.........................
  computeWeightedPowers(isovistArray   )
  { 
    return 0.0; 
  }
  //.........................
  getConnectionWeightFor( connectedIsovist )
  { 
    console.assert( connectedIsovist !=null, "no null isovists" ); 
    console.assert( connectedIsovist in this._connectionWeight, 'Isovist no in connected isovists');
    
    return this._connectionWeight.get( connectedIsovist );
  }
  //.........................
  setConnectedWeightForIsoist( connectedIsovist , weight )
  { 
    console.assert(Number.isFinite( weight ), 'Weight is expected to be a number '); 
    console.assert( weight >= 0.0 , 'No negative weights'); 
    console.assert( weight <= 1.0 , 'Weight not normalised '+ weight); 
    console.assert( this._connections.includes( connectedIsovist ), 'Setting weight for isovist error');
    this._connectionWeight.set( connectedIsovist , weight); 
  }
  //.........................
  /**
   * convert the weights to a format suitble to pass on to a web worker. 
   *  {nodeID:'A', weighed_edges:[ ['B',0.8], ['C',0.2]]}, 
   */
  convertWeightsToWGraphFormat() 
  { 
    let we_edges = [ ]; 
    for (const [key, value] of this._connectionWeight) {
      //console.log(key, value);
      const con = [ key.ID , value  ]; 
      we_edges.push( con ); 
    }
    let node = { nodeID:this.ID , weighed_edges: we_edges} ; 
    if( we_edges.length == 0 )
    { 
      // #here #current looks like not reciving last connection.
      console.log(`NO CONNECTIONS ${this.ID} ${this.connectionCount()}`); 
    }
    return node ; 
  }
  //.........................
  get area_overlap_connectivity()
  { 
    let total =0.0 ; 
    if( this._connectionWeight == null   )return 0.0 ; 

    for (const value of this._connectionWeight.values()) 
    {
      total += value ; // they are all numbers 
    }
    return total ; 
  }
  //.........................
  distance_SquardTo( otherX , otherY )
  { 
    return ((this.x - otherX)*(this.x - otherX))  + 
           (( this.y -otherY)*(this.y - otherY)); 
  }
  //.........................
  _drawDOT(  config = null ) 
  { 

    if(this.edgePolygon == null )
      fill(this._currentColor??'red');
    else {  fill(this._currentColor??'green'); } 

    let r = Isovist.kCellRadius ;

    if( this._selected == true  )  {   r =  Isovist.kCellRadius  * 2; }

    if( config!=null  &&  config.drawInColor == 1 &&  (config.gMinValue < config.gMaxValue))
    { 
      if( this._currentValue <= config.gTop10 )
      { 
        noStroke(); 
        r =  Isovist.kCellRadius  * 1.5;
      }
       if( this._currentValue >= config.gBotom10 )
      { 
        strokeWeight(0.6); 
        stroke('black'); 
        r = r * 0.8 ;// pratically one pixel. 
      }
    }
    ellipse( this._center.x , this._center.y , r, r);
  }
  //.........................
  /**
   *  draws the isovist as a dot. 
   *  Could get more complex in the future - use Eigen Faces? 
   *  #isovist-draw 
   *   let gISOVIST_DRAW_CONFIG = 
{ 
    drawConnections: false , 
    drawFullIsovist: false , 
    drawDOT        : true  , 
    drawInColor : true  ; 
    topHoz: 0 , 
    topVert: 0 , 
    bottomHoz: 0 , 
    bottomVert: 0 , 
    gMinValue : 0 , 
    gMaxValue : 0 , 
    gTop10 : 0 , 
    gBotom10 : 0 
    gRangeSet : false 
}
   * @param {*} config (can be null)
   */
  drawIsovist( config = null )
  { 
    noStroke(); 

    if( config == null)
    { 
      this._drawDOT( null  ) ; 
    }
    
    if( config !=null   && 
      (this._center.x  > config.topHoz)  && 
      (this._center.y >  config.topVert)  && 
      (this._center.x  < config.bottomH )  && 
      (this._center.y  <=  config.bottomV )) 
      { 
        //constructor 
        //text("config    (" +  this.connectionCount() + ") "+ config.drawConnections   , 200, 10 ); 
        //let drawConnections = config.showConnections ?? false ; 
        //@@@ TODO
  
        if( config.drawDOT == true )
        { 
          this._drawDOT( config  ) ;
        }
        if( config.drawConnections == true ) 
        { 
            // get the edge weight and make proportionate.
            strokeWeight(0.02); 
            stroke( pallet[ 2] ); 
            for( let othr of  this._connections)
            {
              if(  this._connectionWeight.has( othr))  
              { 
                const normalised = 1.0 - this._connectionWeight.get(othr);  
                colorMode(HSB, 360, 100, 100);
               
                stroke( 260 * normalised, 99, 99 );  // let c = color(260 * normalised, 99, 99);
               //  stroke( pallet[ 3] ); 
                colorMode(RGB, 256,256,256);

                strokeWeight(this._connectionWeight.get(othr)); 
              }else 
              { 
                stroke( pallet[ 2] ); 
                strokeWeight(0.5); 
              }
              line( this.x , this.y , othr.x , othr.y  ); 
            }
        }
        if( config.drawFullIsovist && this.edgePolygon !=null  )
        { 
          fill(this._currentColor??'#669BBC'); 
          beginShape() ; 
          for( const pt of  this.edgePolygon  )
            { 
              vertex( pt.x, pt.y ); 
            }
          endShape(CLOSE) ; 
        }
        // drawDot 
      }
  }// END OF METHOD 
    /*
          {
            if(this.connectionCount() == 0 )
            {
              let r = 3 ;
              fill('orange');
        
              ellipse( this._center.x , this._center.y , r, r);
            }
          }*/ 
  //. . . . . . . . . . 
  /**
   *  export this isovist as a string in VGA format. 
   * @param {*} config optional 
   */
  exportToSVGString( config = null  )
  { 
    let r =  Isovist.kCellRadius   ;// access static var 
    // fill(this._currentColor??'#669BBC');
    let red_ = red(this._currentColor ); 
    let blue_ = blue(this._currentColor); 
    let green_ = green(this._currentColor); 
    let result = "" ; 

    if( config!=null  &&  config.drawInColor == 1 &&  (config.gMinValue < config.gMaxValue))
    { 
        if( this._currentValue <= config.gTop10 )
        { 
          noStroke(); 
          r =  Isovist.kCellRadius  * 1.5;
          result = `<circle cx="${this._center.x}" cy="${this._center.y}" r="${r}" fill="rgb(${red_.toFixed(0)}, ${green_.toFixed(0)},${blue_.toFixed(0)})"  />
          <!-- IsovistID=${this.ID} -->`; 
          return result ; 
        }
        if( this._currentValue >= config.gBotom10 )
        { 
          strokeWeight(0.6); 
          stroke('black'); 
          r = r * 0.8 ;// pratically one pixel. 
          result = `<circle cx="${this._center.x}" cy="${this._center.y}"
                          r="${r}" fill="rgb(${red_.toFixed(0)}, ${green_.toFixed(0)},${blue_.toFixed(0)})" 
                          stroke="black" stroke-width="1" />  <!-- IsovistID=${this.ID} -->`; 
          return result ; 
        }
     }
   
    result = `<circle cx="${this._center.x}" cy="${this._center.y}" r="${r}" fill="rgb(${red_.toFixed(0)}, ${green_.toFixed(0)},${blue_.toFixed(0)})"  />
      <!-- IsovistID=${this.ID} -->`; 
  
    return result ; 
  }
  //......................................................
  getTableAsString()
  { 
    return `${this._ID},${this._center.x},${this._center.y},${this._connections.length},${this._totalDepth},${this.asymetricAreaTotalDepth},${this.eigenCentrality}`;
  }
}// END OF CLASS ISOVIST 
//===================================================================
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function setupIsovists(  listOfBuildings, boundingBoxPoly=null ,  numberOfProcessors=8 ) 
{ 
  gIsovistGeometryController = new IsovistGeometryController( 
    listOfBuildings  , boundingBoxPoly , numberOfProcessors  ); 
}// end of setupIsovists 
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * do All Processing Random Isovist 
 */
function doAllProcessingRandomIsovist()
{ 
  updateOutput("Random isovist processing"); 
  start_stocastic_sequence(); 
 // doAllProcessingRandomIsovist() 
  //print("DO all Processing"); 
  
  // startSequence(); 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function doAllRegularGirdIsovist()
{ 
  console.log("doAllRegularGirdIsovist "); 
  updateOutput("Regular grid isovist processing"); 
  start_regular_grid_sequence( ); 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/*
    /// 0 Generate_STOCASTIC_IsovsitInteractive
    /// 1 computeAllIsovistsFast(); 
    /// 2 doIsovistIntersections() 
    /// 3 transferGraphToWorkers() 

*/

let KRandomIsovistGridSequence = [
  null , 
  Generate_STOCASTIC_IsovsitInteractive , 
  computeAllIsovistsFast, 
  doIsovistIntersections, 
  transferGraphToWorkers, 
  doAllIntergration, 
  doAreaOfOverlap_Intersections, 
  compute_Fractional_Intergration 

];

let KGridIsovistGridSequence = [ 
  null , 
  GenerateGridIsovsitInteractive , 
  computeAllIsovistsFast, 
  doIsovistIntersections, 
  transferGraphToWorkers, 
  doAllIntergration 
  //doAreaOfOverlapIntergration
]; 

let KGridIsovist_ALL_GridSequence = [ 
  null , 
  GenerateGridIsovsitInteractive , 
  computeAllIsovistsFast, 
  doIsovistIntersections, 
  transferGraphToWorkers, 
  doAllIntergration ,
  doAreaOfOverlap_Intersections,
  compute_Fractional_Intergration 
]; 

let KProcess_HAND_isvosit_seed = [
  null, 
  sanitisedHandIsovistsBeforeProcessing, 
  computeAllIsovistsFast, 
  doIsovistIntersections, 
  transferGraphToWorkers, 
  doAllIntergration ,
  doAreaOfOverlap_Intersections,
  compute_Fractional_Intergration
]; 

let gSequenceTable  =  KRandomIsovistGridSequence ; 

//-----------------------------------------------
/**
 * TODO - dont start sequence if another sequence is running. 
 */
function start_stocastic_sequence()
{ 
  gSequenceTable  =  KRandomIsovistGridSequence; 
  startSequence() ; 
}
//-----------------------------------------------
/**
 * TODO - dont start sequence if another sequence is running. 
 */
function start_regular_grid_sequence()
{ 
  gSequenceTable  =  KGridIsovistGridSequence; 
  startSequence() ; 
}
//-----------------------------------------------
function start_grid_ALL_sequence() 
{
  console.log("Start grid ALL "); 
  gSequenceTable  =  KGridIsovist_ALL_GridSequence; 
  startSequence() ; 
}
//-----------------------------------------------
function start_hand_isovist_sequence()
{ 
  console.log('Start hand isovists'); 
  gSequenceTable  =   KProcess_HAND_isvosit_seed ; 
  startSequence() ; 
}
/**
 * TODO - dont start sequence if another sequence is running. 
 */
//-----------------------------------------------
let gNextSequence = 0; // 0 do nothing  - 
function startSequence( )
{ 
  gNextSequence = 1 ; 
  console.log("Start sequence" +  gSequenceTable.length); 
  cursor(WAIT); 
  processCompleteOK(null, null  ); 
}

//-----------------------------------------------
/**
 * Why does this work on Chrome but not new Safari ? 
 * 
 * @param {*} message 
 * @param {*} theCommend 
 * @returns 
 */
function processCompleteOK( message = 'Complete', theCommend = null )
{ 
  if( gNextSequence == 0 ) { return ; }// skip 
  if( message !== undefined && message != null)
  { 
    console.log("{{"+ message+"}}") ; 
  }
  //console.log("NEXT IN Sequence ="+ gNextSequence + "::processComplete "); 
 
  if( gNextSequence >= gSequenceTable.length )
  { 
      print("Sequence Done"); 
      cursor(ARROW); 
      gNextSequence = 0 ; 
      return ; // skip
  }
  
  let func = gSequenceTable[  gNextSequence ]; 
  gNextSequence += 1 ; 
  console.assert( func != null , " null function oh dear"); 
  func( ); // start next process. 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function doAlert( message)
{
  window.alert(message); 
  updateOutput("<<< " +message + " >>>"); 
}
//---------------------------------------------------------------
function deselectAll() 
{ 
  updateOutput("Everything is deselected."); 
  console.log("Ever Deslect all"); 
  for( const it of gAllIsovists){  it.selected = false ;  }
  gSelectedIsovists.clear(); 
} 
//---------------------------------------------------------------
function select_All()
{ 
  console.log("-User Selects all-"); 
  updateOutput(' All Isovists Selected ');
  for( const it of gAllIsovists)
  {  
    it.selected = true ; 
    gSelectedIsovists.add( it ); 
  }
} 
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * This computes all the isovists of all the isovist objects stored in 
 * the gAllIsovists array. This uses webworkers so talks to 
 * @returns nothing. 
 */
let gIsovistsWaitingToBeRecivedFromMakeIsovistFrom= 0 ; 
let gPeek_gIsovistsWaitingToBeRecivedFromMakeIsovistFrom = 0 ; 

//let gMaxIsovistRadius = 88  ; //makeIsovistFrom 
function computeAllIsovistsFast()
{
  //gAllIsovists - 
  if( gAllIsovists == null || gAllIsovists.length < 3 || gAllIsovists[0].hasIsovist == false  )
  { 
    startModalInputInProgress(); 
      doAlert("You need to generate isovists first ( try command/control R)"); 
    endModalInputInProgress(); 
    return ; 
  }
  updateOutput("Compute All Isovist Max Radius="+gMaxIsovistRadius); 
  console.assert( gMaxIsovistRadius > 0 , "Max IsovistRadius Bad."+ gMaxIsovistRadius)
  let idx = 0 ;
  let cntrlr = getIsovistGeometryController() ; 
  cntrlr.makeAllIsovistsFrom(gAllIsovists); 
  //print("makeAllIsovistsFrom::") ; 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function sanitisedHandIsovistsBeforeProcessing()
{ 
  console.log("Start sanitise  "); 
  let index = 0 ; 
  for( let iso of gAllIsovists )
  { 
    iso.ID = index++ ; 
    iso.resetInfo(); 
  }
  console.log(" End Sanitise. "); 

  processCompleteOK('Sanitise'); 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 *  gIsovistGeometryController singleton  
 */
function getIsovistGeometryController()
{ 
  console.assert (gIsovistGeometryController !=null , "Internal error 1554"); 
  return gIsovistGeometryController; 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 *  !!!This works!!! and in parralel using workers. This uses 
 *  messageRecivedFromIsovst_FINDER_Worker to recive.  
 * @returns nothing 
 */
let g_intersectionsWaiting_to_be_processed = 0 ;

function doIsovistIntersections() 
{ 
  console.log("Compute all isovist intersections"); 
  // check is possibel to . 
  if( gAllIsovists == null || gAllIsovists.length   < 3  )
  { 
    startModalInputInProgress(); 
      window.alert("You need to generate and process isovists first"); 
    endsModalInputInProgress(); 
    return ; 
  }
  if( gAllIsovists[ 0 ].isovistPolygon === undefined || 
    gAllIsovists[ 0 ].isovistPolygon == null )
  { 
    startModalInputInProgress(); 
     window.alert("No insovist polygons"); 
    endsModalInputInProgress(); 
    return ; 
  }
  let controler = getIsovistGeometryController() ; 
  controler.doIsovistIntersections( gAllIsovists ); 
  
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/*function  nextFreeIsovistFinderWorker()
{ 
  let workerIndex = gNextFreeWorker % (gIsovistFINDER_ComputerWorkers.length -1 ); 
  gNextFreeWorker += 1 ; 
  return workerIndex ; 
}*/
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * makeIsovistFrom makes an isovist. -1 will be placed in gMouseIovist, 
 *  -2 gSecondMouseIsoVist ,  
 * @param {number} hoz 
 * @param {number} vert 
 * @param {number} radius 
 * @param {int} isoID 
 */
//let gNextFreeWorker = 0 ; 
function makeIsovistFrom( hoz, vert  , radius = 88, isoID = -1 )
{ 
  let controler = getIsovistGeometryController() ; 
 /// const nextID = gAllIsovists.length + 1 ; 
  controler.makeIsovistFrom( hoz, vert , radius , isoID );

  //updateOutput("Making isovist from " + hoz + " " + vert ); 
}
//-------------------------------------------------------------------------
/**
 * Sample constuct 
 *  let controller = new IsovistGeometryController( number of Processors , [ "script.js" ])
 */
class IsovistGeometryController extends WorkerCoordinator
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
   this.postMessageToAll(processFrame ); 
  }
  //. . . . . . . . . . . . . . . . .
  /* 
      This assumes the building geometrty has been uploaded. 
      asks for a single isovist to be generated. 
  */ 
 // METHOD 
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
  }
   //. . . . . . . . . . . . . . . . .
   // OVERRIDE 
  processingComplete()
  { 
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
  }
   //. . . . . . . . . . . . . . . . .
  /**
   * only draw process ring if doing build processing. 
   */
  drawCurrentStaus()
  { 
    //text(" bulk = "+ this.bulkIsovistsProcessing , 20,20); 
    if( this.bulkIsovistsProcessing == true ){super.drawCurrentStaus();  }

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
      console.time("PIC");
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

      for( idx in gAllIsovists )
      { 
        const isovist = gAllIsovists[ idx ]; 
    
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
      updateOutput(" Iosvist arrived.");
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
    console.assert( info.isovistID < gAllIsovists.length , "Isovist index error 944");
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

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

 
function isovistArea( radial_segments )
{
  let p = radial_segments; 
  let len = p.length; 
  let s = 0; 
  for (let i = 0; i < len; i++) 
  {
    s += (p[i % len].pe.x * p[(i + 1) % len].pe.y) - (p[i % len].pe.y * 
    p[(i + 1) % len].pe.x);
  }
  return s/2;
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

//let gRay = new IsovistRay( new flatten.Point(1,1), new flatten.Point( 100, 30 )) ;


let fig1 = [
  { x: 3, y: 2  },
  { x: 8, y: 2  },
  { x: 8, y: 6  }, 
  { x: 3, y: 6  }
];

let fig2 = [
  { x: 5, y: 4  },
  { x: 12, y: 4  },
  { x: 12, y: 9  },
  { x: 5, y: 9  }
];
  /*
  dropdown = createSelect();

  // Add options to the dropdown
  dropdown.option('Non');
  dropdown.option('Area');
  dropdown.option('Permiter');
  
  // Position the dropdown above the canvas
  dropdown.position(190, 17);*/ 

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// CONFIGUREATION 
const  gDebugTRIANGLE_INTERSECTIONS = false;
let figSol = null ; 
let figUnion = null ;


let dropdown = null ; 
//gDisplayMessage 

function setup() {
  var cvs = createCanvas(  windowWidth, windowHeight -189 ) ; //640, 480  ) ; 
  console.clear();
  // getItem(); 
 // createCanvas(  640, 480 , WEBGL ) ; //windowWidth, windowHeight ) ; //x);
  //console.log("----------setting up-----------"); 
  gBackgroundColor = color('white');
  outputDiv = select('#output'); // Get the div where we'll show output
  updateOutput("Omnivista 2025 Beta preview 1.0.1 "); 
  fOffSetY = width / 2;
  fOffSetX = height / 2;
  cvs.drop(handleFile, handleDrop );
  cvs.dragOver(handleFileDraggedOver); 
  cvs.dragLeave(handleFileLeft );
  
  
  test_Triangle_Intersection_VRD();
  testIntersection_Worker(); 
  //frameRate(20); 
  //  loadCSV(); // THIS IS WORKING! 
  describe('This is a application for processing isovists.');
  home(); 
  if( isSafari()  )
  { 
    const cannot_safari = `This app cannot process in Safari 🙁
      (we are working on it).
      Try opening in Chrome/FireFox/ even Edge works. 
    `; 
    annonceToUser( cannot_safari  ); 
  }else
  { 
    const welcome = `This is ZUI - use mouse to Pan , Scrollwheel to zoom
      type ? to get help. 
      Or see menu items for more help. 
      Type 'r' to process this example file. 
    `; 
    annonceToUser( welcome );
  }

} // END OF SET UP

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function annonceToUser( message  , timeout = 7000 ) 
{ 
  gDisplayMessage = message ; 
  setTimeout(() => {
    
    gDisplayMessage = null ; 
  }, timeout);
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function isSafari() {
  const userAgent = navigator.userAgent;
  return /Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Edge/.test(userAgent) && !/OPR/.test(userAgent);
}

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/*
funct
on draw() {
  background(220);

  if( mouseIsPressed == true)
  { 
    circle( 30,30,15,15); 
  }
  
}*/ 
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function drawMouseIovistRays(theIsovist, fillClr = null  )
{ 
  if ( theIsovist == null ) return ; 

  if( fillClr == null ) 
  { 
    fill( color( 0,0,200,80)); 
  }else 
  { 
    stroke( lerpColor(fillClr, color('black'), 0.10));
    fill( red(fillClr),green(fillClr),blue(fillClr),128 ); 
  }
  strokeWeight(0.5); 
  
  for( let  indexB = 0 ; indexB < theIsovist.length ; indexB++  )
    { 
        let nextIndex = (indexB+ 1) % theIsovist.length; 

      //console.log( "B=", indexB, " of ", theIsovist.length ,"next is ",nextIndex ); 
        console.assert( theIsovist != null ,"### NO Second isovist");
        let segB1 = theIsovist[ indexB ]; 
        let segB2 = theIsovist[ nextIndex ]; 
        console.assert( segB1 != null , " ##FIRST SEG IS EMPTY"); 
        console.assert( segB2 != null , " ##Second SEG IS EMPTY"); 
        console.assert( segB2 !== undefined , " ##Second SEG IS undefined"); 
        beginShape(); 
          vertex( segB1.ps.x ,  segB1.ps.y ); 
          vertex( segB1.pe.x , segB1.pe.y  ); 
          vertex( segB2.pe.x,segB2.pe.y  );
        endShape(CLOSE);
    }
        
  /*for( let idx = 0 ; idx < theIsovist.length-1; idx++ )
    { 
      let curSeg    = gSegList[ idx ]; 
      let getAfter  = gSegList[ idx +1 % theIsovist.length ]; 
      if( getAfter ==  curSeg  ) 
        { 
          stroke( 'orange'); 
        }
      else
      {
        stroke( 'blue'); 
      }
      let  aSeg = theIsovist[ idx ];
      let  aSeg2 = theIsovist[ idx +1 % theIsovist.length ]; 
      line(  aSeg.pe.x , aSeg.pe.y, aSeg2.pe.x , aSeg2.pe.y  ); 
    }*/
}

//-----------------------------------
function drawIsoivstPoloygon(poly ) 
{ 
  if( poly == null ) return ; 

  const vertices  = poly.vertices; 
  beginShape();
  for( let vert of vertices )
  { 
      vertex(vert.x , vert.y); 
  }
  endShape(CLOSE); 
}
//-----------------------------------
function drawVRDpolygon( poly , debug=false ) 
{ 
  if( poly == null ) return ;
  strokeWeight(0.5); 
  console.assert(Array.isArray(poly), ' drawVRDpolygon  is not an array:', poly);
  if( poly.length < 3)
    console.log(" NOT ENOUGHT POINTS!!"); 
  beginShape( ); 
  for( let vert of poly )
    { 
      vertex(vert.x, vert.y); 
    }
  endShape(CLOSE); 
  if( debug == true )
  { 
    let a = polygonAreaVRD( poly ); 
    if( a >  0 ){ fill('black');} else{ fill('red');}
    for( let index in poly )
    { 
      text( ""+index ,poly[index].x, poly[index].y ); 
    }
  } 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function drawBBOX( poly )
{ 
  let bbox = getBoundingBoxVRD(poly);
 
  rectMode(CORNERS); 
  //  rect( bbox.x.min , bbox.y.min,2,2);
  rect( bbox.x.min , bbox.y.min, bbox.x.max, bbox.y.max); 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * debug function when having problems with triangle traignle intersection. 
 * Looks good so removed. 
 */
function draw_debug_triangle_intersections() 
{ 
  if( gDebugTRIANGLE_INTERSECTIONS )
    { 
        if( gDebug_result==null || gDebug_result.length <= 2)
        { 
          fill( 'yellow');
        }else fill( 128,128,128,100); 
  
        let bx1 = getBoundingBoxVRD(gDebug_TriA);
        let bx2 = getBoundingBoxVRD(gDebug_TriB); 
        let itr = doBoundingBoxesOverlap(bx1, bx2); 
  
        drawVRDpolygon( gDebug_TriA, true ); 
        
        noFill(); 
        if( itr ) { stroke( 255,255,255,128); } 
        else { stroke( 255,0,0,128); }
        drawBBOX(gDebug_TriA); 
        //drawVRDpolygon(gIsoVistPolygoVRD); 
        fill( 0,0,190, 100 ); drawVRDpolygon( gDebug_TriB, true);
        noFill(); stroke( 255,255,255,128); drawBBOX(gDebug_TriB); 
        //drawVRDpolygon(gSecondIsovistVRDPolygon); 
    }// END IF gDebugTRIANGLE_INTERSECTIONS 

    if( gDebugTRIANGLE_INTERSECTIONS )
      {
          fill('pink' );
          stroke('white'); 
          /*line( gSegmentCrossDebug[ 0].x ,  gSegmentCrossDebug[ 0].y , 
          gSegmentCrossDebug[ 1].x, gSegmentCrossDebug[ 1 ].y  );*/  
          
          ellipse( gSideMouseDebug.x, gSideMouseDebug.y , 3 , 3 );
          noStroke(); 
          text("" + gSideValue , gSideMouseDebug.x+30, gSideMouseDebug.y+10 ); 
          
          if( gDebug_result !=null && gDebug_result.length > 2)
          { 
            drawVRDpolygon( gDebug_result, true);
          }
          strokeWeight(0.5);
          fill('red');
          stroke('black'); 
          //print(  gDebug_intersectr_Pts.length); 
          for (let  px of gDebug_intersectr_Pts) 
          {
            
          // print(px.x , px.y ); 
            ellipse( px.x, px.y , 3 , 3 );
            text( " "+px.index , px.x, px.y );
          }
          stroke('grey');
          fill('green');
          for( let px of gDebug_cross_pts )
          { 
            fill('blue');//  should never be blue..
            if( px.debug_testA==true)
            {  fill('red'); }
            if( px.debug_testB==true)
            { fill('orange'); }
            if( px.debug_testA==true && px.debug_testB==true)
            { fill('yellow'); }
              ellipse( px.x, px.y , 2 , 2 );
          }
    }
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * return the largest bounding box polygon. 
 * @param {Array of buildings in VRD polygon format} listOfBuildings 
 * @returns 
 */
function getBiggestPolygon( listOfBuildings )
{ console.assert( listOfBuildings!=null, "getBiggestPolygon:No empty args"); 
  console.assert( Array.isArray(listOfBuildings), "getBiggestPolygon:expect lst "); 
  let biggest = null ; 
  let area = 0.0 ; 
  for( let it of listOfBuildings )
  { 
    let box = getBoundingBoxVRD(it); 
    let ar = (box.x.max-box.x.min)*(box.y.max-box.y.min); 
    if( ar > area )
    { 
      biggest = it ; 
      area = ar ; 
    }
  }
  return biggest; 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 *  Takes the array of buildings and updates the 
 *  global someSegments  gQuadTree. 
 * Finds the bounding polygon and then sets gboundingBox 
 *  
 * @param {Array of buildings (VRDPolyongs)} buidlings_to_add 
 */
function loadbuildingsFromPolygons( buidlings_to_add ) 
{ 
  //updateOutput("loading building"); TO EARLY 
  // gBuilding_polygons -> global 
  console.assert( Array.isArray(buidlings_to_add), " buidlings_to_add Not array" );
  console.assert( Array.isArray(buidlings_to_add[0]), "buidlings_to_add not an array of poly "); 
  gBuilding_polygons = buidlings_to_add ; 
  gBoundingBoxPoly   = null ; // RESET 
  
  
  //              handle bonding polygon 
  //gQuadTree = makeQuadTree( someSegments ); 
  let bounds = getBiggestPolygon( buidlings_to_add ); 
  if( bounds != null )
   { 
    for( const build of buidlings_to_add)
    { 
      if( build == bounds)continue ; //skip self. 
      if( polygonVRDWholeContainedByPolygonVRD( bounds ,build )== false)
      { 
        console.log("BOUNDING BOX : No bounds found."); 
        bounds = null ; 
        break ; 
      }
    }
    
    gBoundingBoxPoly = bounds ; 
    let index = buidlings_to_add.indexOf(bounds);
   //print("%% found bbox", index, buidlings_to_add.length ); 
   // print( bounds );
    if( index != -1 )
    { 
      //const before =  buidlings_to_add.length ; 
      buidlings_to_add.splice(index, 1);
      //print("%% before " + before + "%% After ", buidlings_to_add.length );
     // delete buidlings_to_add[index]; 
    }else
    { 
      console.error("could not find bounding box in the oringa list!!!???"); 
    }
    //
    // CANNOT UPDate updateOutput(`Loaded  ${buidlings_to_add.length} buildings + found boundary` );
  }//
 
  if( bounds == null )
  { 
    let r = confirm("Could not find bounding (edge) polygon .\n Ok to add one? Canel to leave without one"); 
    if(r==true) 
    { 
      //print("add bounding box"); 
      addBuildingsBoundingBox(); 
    }else 
    { 
      //print("leave without bounding box"); 
    }
  }
  setupIsovists(  buidlings_to_add, gBoundingBoxPoly,  gNumberOfProcessors ) ;
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * Used by the isovist generator. Looks at all buildings.
 * @returns 
 */
function getBoundingBoxForAllbuildingPolygons()
{ 
  let bbox = {
    x: {
      min: -10,
      max: -10
    },
    y: {
      min: 10,
      max: 10 
    }
  };
  if( gBuilding_polygons == null || gBuilding_polygons.length==0)return bbox ; 
  
  // bbox must be at least 1 
  bbox =   getBoundingBoxVRD(gBuilding_polygons[ 0 ] ) ; 
  
  for( let bld = 1 ; bld < gBuilding_polygons.length ;bld++)
    { 
      let building = gBuilding_polygons[ bld ]; 
      console.assert( Array.isArray(building), "Not array" );
      const bb = getBoundingBoxVRD(building ) ; 
      bbox = unionOfBoundingBoxsVRD(bbox, bb  ); 
    }
    return bbox 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 *  adds a building bounding box. by looking at gBuilding_polygons
 */

function addBuildingsBoundingBox()
{ 
  /* print("Adding bounding box" , someSegments.length ); 
  if( gBuilding_polygons == null || gBuilding_polygons.length==0)return ; 
  
  // bbox must be at least 1 
  let bbox =   getBoundingBoxVRD(gBuilding_polygons[ 0 ] ) ; 
  
  for( let bld = 1 ; bld < gBuilding_polygons.length ;bld++)
    { 
      let building = gBuilding_polygons[ bld ]; 
      console.assert( Array.isArray(building), "Not array" );
      const bb = getBoundingBoxVRD(building ) ; 
      bbox = unionOfBoundingBoxsVRD(bbox, bb  ); 
    }
    bbox.x.min -= 5; // inset by small amount.
    bbox.y.min -= 5; 
    bbox.x.max += 5 ; 
    bbox.y.max += 5; 

    let seg = new Segment( 
      new Point(bbox.x.min, bbox.y.min),     
      new Point(bbox.x.min, bbox.y.max));
    someSegments.push(seg);

    let seg2 = new Segment(      
      new Point(bbox.x.min, bbox.y.max),
      new Point(bbox.x.max, bbox.y.max));
    someSegments.push(seg2);

    let seg3 = new Segment(      
      new Point(bbox.x.max, bbox.y.max), 
      new Point(bbox.x.max, bbox.y.min));
    someSegments.push(seg3);

    let seg4 = new Segment(       
      new Point(bbox.x.max, bbox.y.min), 
      new Point(bbox.x.min, bbox.y.min),);
    someSegments.push(seg4);

    print("box added =" , someSegments.length ); 
   // gQuadTree = makeQuadTree( someSegments ); 
    // make a new bounding box polygon.
    gBoundingBoxPoly = [ 
      {  x: bbox.x.min, y: bbox.y.min }, 
      {  x: bbox.x.min, y: bbox.y.max}, 
      {  x: bbox.x.max, y: bbox.y.max }, 
      {  x: bbox.x.max, y: bbox.y.min }
    ];
    */ 
}

//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * Talks to global gBuilding_polygons and draws all bthe buildings 
 * if not null does nothing. 
 * @returns nothing 
 */
function drawBuildings() 
{ 
    function drawAbuilding( build )
    { 
      console.assert( Array.isArray(build), "Not array right format?" );
      beginShape(); 
      for( let idx = 0; idx  < build.length; idx++ )
      { 
        vertex( build[ idx].x , build[ idx].y );
        /*line( building[ idx-1].x , 
          building[ idx-1].y , 
          building[ idx].x , 
          building[ idx].y );*/ 
         // print( building[ idx-1].x, building[ idx-1].y );
      }
      endShape(CLOSE);
    }
// gBuilding_polygons -global 
 
  fill(kBuildingFill); 
  //print(gBuilding_polygons.length ); 
  if( gBuilding_polygons == null )return ;

  noStroke(); 
  text( "Buildings = " + gBuilding_polygons.length , 20, 20  ); 
  text( "Bbox null " + (gBoundingBoxPoly==null ), 20, 50); 
  //stroke(kBuildingFill ); 
  fill( kBuildingFill);
  for( let bld = 0 ; bld < gBuilding_polygons.length ;bld++)
  { 
    let building = gBuilding_polygons[ bld ]; 
    if( building != gBoundingBoxPoly )
    drawAbuilding( building ); 
  }

  if(gBoundingBoxPoly!=null) 
  { 
    noFill(); 
    stroke( pallet[2]); 
    strokeWeight( 2); 
    drawAbuilding(gBoundingBoxPoly);
    strokeWeight( 1);
  } 
} //// this can be called if the que is empty so we check process

//let gShowQuadTree = false ; 
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
let gISOVIST_DRAW_CONFIG = 
{ 
    drawConnections: false , 
    drawFullIsovist: false , 
    drawDOT        : true  , 
    drawInColor : true  , 
    topHoz: 0 , 
    topVert: 0 , 
    bottomHoz: 0 , 
    bottomVert: 0, 

    gMinValue : 0 ,  // min value of current value (the red) 
    gMaxValue : 0 ,  // max value of current value ( the blue)
    gTop10 : 0 , 
    gBotom10 : 0 ,
    gRangeSet : false 

}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function toggleShowConnections()
{ 
  gISOVIST_DRAW_CONFIG.drawConnections = ! gISOVIST_DRAW_CONFIG.drawConnections ;
  updateOutput("See Connections " + gISOVIST_DRAW_CONFIG.drawConnections)  ;
  return  gISOVIST_DRAW_CONFIG.drawConnections; 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function toggleShowFullIsovists() 
{ 
  gISOVIST_DRAW_CONFIG.drawFullIsovist = ! gISOVIST_DRAW_CONFIG.drawFullIsovist;
  updateOutput("See Full Isovists " + gISOVIST_DRAW_CONFIG.drawFullIsovist  ) ; 
  return gISOVIST_DRAW_CONFIG.drawFullIsovist; 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function toggleShowDOT()
{ 
  gISOVIST_DRAW_CONFIG.drawDOT = ! gISOVIST_DRAW_CONFIG.drawDOT;
  updateOutput("See Dots " +  gISOVIST_DRAW_CONFIG.drawDOT); 

  return  gISOVIST_DRAW_CONFIG.drawDOT ; 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**
 * This is the big function which handles all the drawing. 
 */
//---------|--------------|----------------|---------
function drawScaled() 
{
  stroke(127);
  line(-100, 0, 100, 0);
  line(0, -100, 0, 100);
  let c1 = color(255, 204, 0 );
  
  let topV = convertWindowToMapCoordY(3); 
  let topH = convertWindowToMapCoordX(3); 
  let bottomV = convertWindowToMapCoordY( height - 3); 
  let bottomH = convertWindowToMapCoordX( width - 3 ); 
  if( false ) 
  { 
    stroke( 'red' ); 
    strokeWeight(2); 
    noFill(); 
    rectMode(CORNERS);
    rect( topH, topV ,bottomH ,bottomV );
  }

  /*for( const index in someLines )
  { 
    aline = someLines[ index ]; 
    line(aline[0], aline[1], aline[2],aline[3] );
}*/ 
//  if( gQuadTree !=null && gShowQuadTree == true )gQuadTree.debug_draw();

  drawBuildings(); 
  
  //stroke( 0,0,170);
  stroke( '#388ec788');
  const mcol = color(kIsovistColor);
  let fcol =  color( kIsovistColor2 ) ; // color('#38c7b888');//color(200,0,0,80); 

  if(gMouseIovist!=null) drawMouseIovistRays( gMouseIovist,mcol ) ; 
  if(gSecondMouseIsoVist!=null )drawMouseIovistRays(gSecondMouseIsoVist,fcol );
  
  //drawIsoivstPoloygon(gBothIntesect);
  const kDawMouseClick = false ;
  if(kDawMouseClick )
  {
    stroke( 0,0,170);
    //gRay.draw() ; 
    ellipse( lstMouseX, lstMouseY , 9 , 9 ); 
  }

  gISOVIST_DRAW_CONFIG.topHoz = topH ;
  gISOVIST_DRAW_CONFIG.topVert = topV; 
  gISOVIST_DRAW_CONFIG.bottomV = bottomV ; 
  gISOVIST_DRAW_CONFIG.bottomH = bottomH ; 
  gISOVIST_DRAW_CONFIG.drawInColor = gColorByIsColor ; 

  const startTime = millis(); 
  const oldSetting = gISOVIST_DRAW_CONFIG.drawConnections ;
  const oldShowStuff =  gISOVIST_DRAW_CONFIG.drawFullIsovist ; 
  let skipper = 0 ; 
  gSelectedIsovists.forEach(isovist => { isovist.selected = true  ;} );
  if( gAllIsovists !== undefined && gAllIsovists!=null )
  {
   // text(" drawisovists " + gAllIsovists.length, 120, 20 ); 
    strokeWeight(0.5); 
   // const config = {  drawConnections: false    };
    
    for(const  it of gAllIsovists)
    { 
      it.drawIsovist( gISOVIST_DRAW_CONFIG ); 
     
      if(  (skipper++ % 100 == 0)  && (millis()  - startTime) > 40 )// 15 
      { 
        gISOVIST_DRAW_CONFIG.drawConnections = false ;
        gISOVIST_DRAW_CONFIG.drawFullIsovist = false ; 
      }
    }
  }

  gISOVIST_DRAW_CONFIG.drawConnections = oldSetting ; 
  gISOVIST_DRAW_CONFIG.drawFullIsovist = oldShowStuff; 
  
  //line( topH, topV ,bottomH ,bottomV  );

  debugSegments();
  draw_debug_triangle_intersections(); 

  runIntersections();
  
  //test_Triangle_Intersection_VRD();
}// END OF DRAW SCALED 
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

function debugSegments()
{ 
  strokeWeight(0.5); 
  if(gDebugIntersection != null  )
    { 
      fill( 255,0,0, 100 ); 
      //drawVRDpolygon(gDebugIntersection); 
    }

  if( gInterSectZones != null)
  {
    for( let polyVR of gInterSectZones  )
    { 
      
          //fill( 255,255,0, 100 );
          fill('#c7b83888'); 
          stroke('#c7b83888');
          drawVRDpolygon( polyVR );
    }
  }
    
  if( gSeg1 != null ) 
    { 
       stroke('red'); 
       line( gSeg1.ps.x ,gSeg1.ps.y , gSeg1.pe.x , gSeg1.pe.y ); 
    }
    if( gSeg2 != null ) 
    { 
         stroke('red'); 
         line( gSeg2.ps.x ,gSeg2.ps.y , gSeg2.pe.x , gSeg2.pe.y ); 
    } 
    if( gSegB1 != null ) 
    { 
      stroke('white'); 
      line( gSegB1.ps.x ,gSegB1.ps.y , gSegB1.pe.x , gSegB1.pe.y ); 
    } 
    if( gSegB2 != null ) 
    { 
      stroke('white'); 
      line( gSegB2.ps.x ,gSegB2.ps.y , gSegB2.pe.x , gSegB2.pe.y ); 
    }
    strokeWeight(1); 
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

//---------|--------------|----------------|---------


//----------------------------------------------------------------
/**
 * 
 * Talks to 
 * gSegB1 , gSegB2 , gDebugIntersection - global debugs. 
 * @param {*} triA 
 * @param {*} isoVistB 
 * @param {*} listOfIntersectionPolys 
 * @returns 
 */
function isoVistIntersectionWithTriangle( triA,  isoVistB , listOfIntersectionPolys )
{ 
  console.assert( Array.isArray(listOfIntersectionPolys), " listOfIntersectionPolys not array") ; 
  let triB  = [ { x: 200, y: 100  },{ x: 200, y: 300  }, { x: 350, y: 300  } ];
  let interesctionArea = 0 ; 
  let areaB = 0 ; 

  for( let  indexB = 0 ; indexB < isoVistB.length ; indexB++  )
    {  
        let nextIndex = (indexB+ 1) % isoVistB.length; 
      //console.log( "B=", indexB, " of ", isoVistB.length ,"next is ",nextIndex ); 
      console.assert( isoVistB != null ,"### NO Second isovist");
        let segB1 = isoVistB[ indexB ]; 
        let segB2 = isoVistB[ nextIndex ]; 
        console.assert( segB1 != null , " ##FIRST SEG IS EMPTY"); 
        console.assert( segB2 != null , " ##Second SEG IS EMPTY"); 
        console.assert( segB2 !== undefined , " ##Second SEG IS undefined"); 
        if( distance(segB1.pe, segB2.pe)  < 0.0000001 )
        { 
          //console.log("SKIP B ",segB1.pe, segB2.pe ); 
          continue; // skilp 
        }
                //console.log(" TYPE = ",  typeof segB1 , " segB1 = ", segB1);
        //console.log("isoVistB =" , isoVistB ) ; 
        triB[ 0 ].x = segB1.ps.x ;  triB[ 0 ].y = segB1.ps.y ;
        triB[ 1 ].x = segB1.pe.x ;  triB[ 1 ].y = segB1.pe.y ; 
        triB[ 2 ].x = segB2.pe.x ;  triB[ 2 ].y = segB2.pe.y ; // this will be backward

        let areaOfTriB = polygonAreaVRD(triB  ); 
        areaB += Math.abs( areaOfTriB);  // area seems OK. 
        
        gSegB1 = segB1 ;  gSegB2 = segB2 ;
        // area of A and B are not problematic.  Distance is OK 
        // Somthign is throwing the values off. 
        //console.log(areaOfTriB, distance(triB[ 1 ], triB[ 2 ]  ),polygonAreaVRD(triA ) ); 
        try
        {
          // Use new sheep delveoped version . 
         let  intsctn_poly =intersectTriangle_VRD( triA , triB );
         if( intsctn_poly == null  || intsctn_poly.length == 0 )
          { 
           //print("@@@ isoVistIntersection:: no intersect@@@@@"); 
          }
          else
          { 
              console.assert( intsctn_poly!=null , "IMPOSSIBLE for ",indexB , intsctn_poly.length ); 
              gDebugIntersection =  intsctn_poly; 
              //NOTE THIS IS NOW POSSILY NEGATIVE 
              let area_of_intersection = polygonAreaVRD(intsctn_poly );
              interesctionArea += Math.abs(area_of_intersection);
              listOfIntersectionPolys.push(intsctn_poly );
            //console.log( "overlap ", polygonAreaVRD(r[0] ), " t1=",interesctionArea.toFixed(2)  );
          }
        }
        catch( error)
        { 
          console.log("ERROR "); 
          console.log("TriA, ",  triA.length) ; 
          console.log( triA[0].x , triA[0].y); 
          console.log( triA[1].x , triA[1].y);
          console.log( triA[2].x , triA[2].y);
          console.log("Tri B, ",  triB.length) ;
          console.log("AreaB=", areaOfTriB);  
          console.log( triB[0].x , triB[0].y); 
          console.log( triB[1].x , triB[1].y);
          console.log( triB[2].x , triB[2].y);
          console.log(error); 
          //console.error( "TriA", triA); 
          //console.error( "Tri B", triB); 
        }
      }// end of for loop.
    console.log( "| LOP| =",listOfIntersectionPolys.length); 
    console.log( "interesctionArea", interesctionArea.toFixed(3)); 
    console.log("areaB", areaB.toFixed(3));
    return [ interesctionArea ,areaB];
}
//----------------------------------------------------------------
/**
 *  Stop the overload of the intersection process by only intersecting
 *  two triangles at a time. 
 *  Means you have to step through the isovists triangles. 
 *  Untimately we only want the area of intersection and the 
 *  area of the individual isovcists. 
 * @param { array of Segments } isoVistA 
 * @param { array of Segments } isoVistB 
 * @returns 
 */
function isoVistIntersection( isoVistA , isoVistB)
{ 
  console.assert(  isoVistA != null   , " argument A should be a list." );
  console.assert(  isoVistA instanceof  Array , " argument A should be a list." );

  let interesctionArea = 0.0; 
  let areaA  = 0.0; 
  let areaB  = 0.0;
  let listOfIntersectionPolys = [ ]; // list of 

  let triA = [  { x: 100, y: 200  }, { x: 300, y: 150  }, { x: 300, y: 250  } ];
  //let indexB = 5;
  //let triB  = [ { x: 200, y: 100  },{ x: 200, y: 300  }, { x: 350, y: 300  } ];
 
  //let intr = intersectTriangle_VRD( triA , triB ); 
// FIRST TRIANGLE FROM FIRST ISOVIST 
//console.log("**" ,  Utils.EQ(1,1)); 
   for( let  indexA = 0 ; indexA < (isoVistA.length) ; indexA++  )
  { 
    let nextIndex = (indexA+ 1) % isoVistA.length; 
    let seg1 = isoVistA[ indexA ]; // Seg is ps.x , ps.y , ps.x , ps.y
    let seg2 = isoVistA[ nextIndex  ]; 
    console.assert( seg1 != null , "null seg1" );
    console.assert( seg2 != null , "null seg2" );

    triA[ 0 ].x = seg1.ps.x ;  triA[ 0 ].y = seg1.ps.y ; // Center of isovist 
    triA[ 1 ].x = seg1.pe.x ;  triA[ 1 ].y = seg1.pe.y ; 
    triA[ 2 ].x = seg2.pe.x ;  triA[ 2 ].y = seg2.pe.y ; 
    gSeg1 = seg1 ;gSeg2 = seg2;// Debug 
    if( distance(triA[ 1 ], triA[ 2 ])  < 0.0000001 )
    { 
      console.log("SKIPPING"); 
        continue; // skip super short segments that cause failure. 
    }
    
    areaA += polygonAreaVRD(triA  ); 

    let [ sub_interesctionArea ,sub_areaB  ]= 
    isoVistIntersectionWithTriangle( triA,  isoVistB , listOfIntersectionPolys ); 
     interesctionArea += sub_interesctionArea;
     areaB += sub_areaB ; 
     console.log( indexA," " ,isoVistA.length ,"+LOP+", listOfIntersectionPolys.length );
     break ; 
    } // End of for loop.

  console.log("-lenght of interect poly",listOfIntersectionPolys.length );
  return [ interesctionArea ,areaA, areaB, listOfIntersectionPolys]  ;
  // SECOND TRIANGLE FROM SECONG ISOVIST
}
//---------------------------------------------------------------
function findClosesIsoivstToPoint( mouseX , mouseY  )
{ 
  let minPoint = null ; 
  let minDis2 = Number.MAX_VALUE; 
  for( const iso of gAllIsovists)
  { 
    const  d = iso.distance_SquardTo( mouseX, mouseY ); 
    if( d < minDis2  )
    { 
      minDis2 = d ; 
      minPoint = iso; 
    }
  }
  return minPoint; 
}
//---------------------------------------------------------------
/**
 *  Select the isovist from the coordinates x,y (deselcts all others )
 *  
 * @param {number} mouseX - in world coordinates.
 * @param {number} mouseY - in world coordinates.
 */
function selectFromPoint( mouseX , mouseY )
{ 
    for( const it of gAllIsovists){  it.selected = false ;  }
    let iso = findClosesIsoivstToPoint( mouseX , mouseY); 
    if( iso != null )
    { 
      updateOutput("selected "+ iso.x.toFixed(1) + " " +iso.y.toFixed(1) +
         " ID= " +iso.ID + " " + iso.currentValue.toFixed(2) ); 
      //print("select point ," , lstMouseX.toFixed(1) , lstMouseY.toFixed(1) ); 
      console.log("selected "+ iso.x.toFixed(1) + " " +iso.y.toFixed(1) +
         " ID=" +iso.ID + " "+ iso.currentValue + " k= "+ iso.connectionCount()  ); 
      
      for( let it of  gSelectedIsovists )
      { 
        it.selected = false ; 
      }

      gSelectedIsovists.clear(); 
      iso.selected = true ;
      gSelectedIsovists.add( iso ); 
      console.log("Size of selected " , gSelectedIsovists.size  , " " , iso.selected ) ; 
    }
}

/**
 * Prompts the user to enter a new maximum isovist radius.
 * Validates the input to ensure it is a number greater than zero.
 * If valid, updates the global variable `gMaxIsovistRadius` with the new value.
 *
 * @function
 * @name askUserForMaxRadius
 * @returns {void}
 *
 * @example
 * // Initial value of gMaxIsovistRadius is 50
 * askUserForMaxRadius();
 * // If user enters 75, gMaxIsovistRadius is updated to 75
 * // If user enters invalid input, an alert is shown and the value remains unchanged
 */

let gMaxIsovistRadius = 88  ; 

function askUserForMaxRadius()
{ 
  startModalInputInProgress(); 
    const promptMessage = "Enter the maximum isovist radius:";

    const userInput = prompt(promptMessage, gMaxIsovistRadius);

    if (userInput === null) 
    {
      console.log("User canceled the input.");
      endModalInputInProgress(); 
      return; // Exit the function without making changes
    }
    // Trim any leading/trailing whitespace from the input
    const trimmedInput = userInput.trim();
    const parsedNumber = Number(trimmedInput);

    // Validate that the input is a number and greater than zero
    if (!isNaN(parsedNumber) && parsedNumber > 0) {
      // Update the global variable with the new value
      gMaxIsovistRadius = parsedNumber;
      console.log(`gMaxIsovistRadius has been updated to: ${gMaxIsovistRadius}`);
    } else {
      // Inform the user of invalid input
      alert("Invalid input. Please enter a valid number greater than zero.");
    }
  endModalInputInProgress();

}
//----------------------------------------------------------------
function mousePressed()
{ 
  gDisplayMessage = null ; // dismiss message 
}
//----------------------------------------------------------------
function mouseClicked() 
{ 
  lstMouseX = convertWindowToMapCoordX(mouseX ); 
  lstMouseY = convertWindowToMapCoordY( mouseY)  ; 

  //gSideMouseDebug.x = lstMouseX.toFixed(0) ; 
  //gSideMouseDebug.y = lstMouseY.toFixed(0) ; 
  
  //gSideValue = ""+ getSideOfLine(  gSideMouseDebug , gSegmentCrossDebug ); 

  switch(  getCurrentTool()    )
  { // current 4  tools 
    case kDRAG_AND_PAN : 
    { 
      // nothing 
    }break ; 

    case kISOVIST_DROPPER: 
    { 
      if( isModalInputInProgress() ) return ; // ignore alert clicks. 

      if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) // innore clicks outside winsow 
        { 
            const nextID = gAllIsovists.length ; 
            let iso = new Isovist( lstMouseX ,lstMouseY, null  ); 
            gAllIsovists.push(iso);
            //console.log( "new isovists N="+gAllIsovists.length ); 
            //computeAllIsovistsFast(); 
            //makeIsovistFrom( lstMouseX , lstMouseY , gMaxIsovistRadius,nextID );//  -1 for mouse 
        } 
    } break ; 

    case kINFO: 
    { 
      print(" Select ");
      selectFromPoint( lstMouseX , lstMouseY ); 
    }


  }
  return ; 
} 
  /* CODE WAS 
  if( keyIsPressed == true )
  {
    // if( keyCode == CONTROL) DONT WORK
    
    if( keyCode == SHIFT )
    { 
      console.log("(( MAKE ISOVIST ))"); 
      //let iso = makeIsovistFrom(lstMouseX , lstMouseY , gMaxIsovistRadius );
      //iso = makeIsovistPolygonFromIsoRays( iso );
     // gMouseIovist = iso ; 
     // let ar = Math.abs(isovistArea( iso )); 
      //updateOutput('Area = ' + ar.toFixed(2)); 
      
      return ; 
    }
    if( keyCode == OPTION)
    {

     // let iso = makeIsovistFrom(lstMouseX , lstMouseY , gMaxIsovistRadius );
     // gSecondMouseIsoVist =  makeIsovistPolygonFromIsoRays( iso );
     // let ar = Math.abs(isovistArea( iso )); 
     // updateOutput('Area 2 = ' + ar.toFixed(2)); 
     
      //makeIsovistFrom( lstMouseX , lstMouseY , 188, -2 );
      return ;
    }
    // find closest isovist and select it. 
  }*/ 

// end mouse clicked.
/*
let isoVistA=  gMouseIovist; 
let isoVistB =  gSecondMouseIsoVist ;  
gMouseIovist, gSecondMouseIsoVist
*/
//--------------------------------------------------------------------
/**
 * NEED a version of this which accepts both isovsits as arguments.
 * returns the area of overlap plus the polygon 
 * @param {number} indexA 
 * @param {number} indexB 
 * @param {Boolean} accumulate 
 * @returns 
 */
function processIsovists( indexA ,indexB ,isoVistA, isoVistB,  accumulate = false  )
{   
  let interesctionArea = 0.0; 
  let areaA  = 0.0; 
  let areaB  = 0.0;
  let area_of_intersection = 0 ; 
  let listOfIntersectionPolys = [ ]; // list of 
  if( accumulate == true ) listOfIntersectionPolys =gInterSectZones;

  let triA = [  { x: 100, y: 200  }, { x: 300, y: 150  }, { x: 300, y: 250  } ];
  let triB  = [ { x: 200, y: 100  },{ x: 200, y: 300  }, { x: 350, y: 300  } ];

    indexA = indexA % isoVistA.length; 
    indexB = indexB % isoVistB.length; 
    if( indexA < 0 )indexA = isoVistA.length-1 ; 
    if( indexB < 0 )indexB = isoVistB.lenght -1 ; 

    let nextIndex = (indexA+ 1) % isoVistA.length; 
    let seg1 = isoVistA[ indexA ]; // Seg is ps.x , ps.y , ps.x , ps.y
    let seg2 = isoVistA[ nextIndex  ]; 
    console.assert( seg1 != null , "null seg1" );
    console.assert( seg2 != null , "null seg2" );

    triA[ 0 ].x = seg1.ps.x ;  triA[ 0 ].y = seg1.ps.y ; // Center of isovist 
    triA[ 1 ].x = seg1.pe.x ;  triA[ 1 ].y = seg1.pe.y ; 
    triA[ 2 ].x = seg2.pe.x ;  triA[ 2 ].y = seg2.pe.y ; 
    gSeg1 = seg1 ;gSeg2 = seg2;// Debug 

  let nextIndexB = (indexB+ 1) % isoVistB.length; 
  //console.log( "B=", indexB, " of ", isoVistB.length ,"next is ",nextIndex ); 
  console.assert( isoVistB != null ,"### NO Second isovist");
  let segB1 = isoVistB[ indexB ]; 
  let segB2 = isoVistB[ nextIndexB ]; 
  console.assert( segB1 != null , " ##FIRST SEG IS EMPTY"); 
  console.assert( segB2 != null , " ##Second SEG IS EMPTY"); 
  console.assert( segB2 !== undefined , " ##Second SEG IS undefined"); 

          //console.log(" TYPE = ",  typeof segB1 , " segB1 = ", segB1);
  //console.log("isoVistB =" , isoVistB ) ; 
  triB[ 0 ].x = segB1.ps.x ;  triB[ 0 ].y = segB1.ps.y ;
  triB[ 1 ].x = segB1.pe.x ;  triB[ 1 ].y = segB1.pe.y ; 
  triB[ 2 ].x = segB2.pe.x ;  triB[ 2 ].y = segB2.pe.y ; // this will be backward

  let areaOfTriB = polygonAreaVRD(triB  ); 
  areaB += Math.abs( areaOfTriB);  // area seems OK. 
  
  gSegB1 = segB1 ;  gSegB2 = segB2 ;
  // area of A and B are not problematic.  Distance is OK 
  // Somthign is throwing the values off. 
  //console.log(areaOfTriB, distance(triB[ 1 ], triB[ 2 ]  ),polygonAreaVRD(triA ) ); 
  
    // Use new sheep delveoped version . 
   let  intsctn_poly =intersectTriangle_VRD( triA , triB );
   if( intsctn_poly == null  || intsctn_poly.length == 0 )
    { 
     //print("@@@ isoVistIntersection:: no intersect@@@@@"); 
    }
    else
    { 
        console.assert( intsctn_poly!=null , "IMPOSSIBLE for ",indexB , intsctn_poly.length ); 
        gDebugIntersection =  intsctn_poly; 
        //NOTE THIS IS NOW POSSILY NEGATIVE 
        area_of_intersection = polygonAreaVRD(intsctn_poly );
        interesctionArea = Math.abs(area_of_intersection);
        listOfIntersectionPolys.push(intsctn_poly );
      //console.log( "overlap ", polygonAreaVRD(r[0] ), " t1=",interesctionArea.toFixed(2)  );
    }
    gInterSectZones = listOfIntersectionPolys ; 
    console.assert( interesctionArea >= 0 , "ABS has failed" );
    return interesctionArea; 
}//END OF FUNCTION 

let gMDown_triangle = 0; 
let gLast_trigangle = 0 ;
let gTotalAreaOfIntersection = 0 ; 
//--------------------------------------------------------------------
function increment_triangles()
{ 
  gLast_trigangle += 1; 
  if( gLast_trigangle > gMouseIovist.length-1 )
  { 
    gMDown_triangle += 1  ; 
    gLast_trigangle = 0 ; // 
    if( gMDown_triangle > gSecondMouseIsoVist.length-1) 
    { 
      gLast_trigangle = 0 ; //gMouseIovist.length-1; 
      gMDown_triangle = 0 ; // 1  ; // STOP
      gRunIntersections = false ; // STOIP
      //gInterSectZones= [] ;
    }
  }
  gTotalAreaOfIntersection += 
      processIsovists(gLast_trigangle,gMDown_triangle , gMouseIovist, gSecondMouseIsoVist, true ); 

  updateOutput("∂ " + gLast_trigangle + " "+gMDown_triangle + " " + gMouseIovist.length  + " dv= " + gTotalAreaOfIntersection.toFixed(2) + " area="+  Math.abs(isovistArea(  gMouseIovist ) )); 
      
}
//--------------------------------------------------------------------
function computeIntersectionOfIsovists_OLD()
{
  print("COMPUTE"); 
  let isoVA = gMouseIovist; 
  let isoVB = gSecondMouseIsoVist; 
  let total_intersection_Area = 0 ; 
  let ACCUMULATE = true  ; 
  gInterSectZones = [ ] ; // RESET 
  for( let isovistA_index  = 0 ; isovistA_index < isoVA.length-1; isovistA_index++ )
  {
    for( let isovistB_index = 0 ; isovistB_index < isoVB.length-1; isovistB_index++)
    { 
      total_intersection_Area += 
      processIsovists(isovistA_index,isovistB_index , isoVA, isoVB, ACCUMULATE );
    }
  }
  total_intersection_Area = Math.abs(total_intersection_Area); 
  let areaA  = Math.abs( isovistArea( isoVA )) ; 
  let bArea =  Math.abs( isovistArea( isoVB )) ;
  let unionArea = areaA + bArea - total_intersection_Area; 
  print(" overlap area = ", total_intersection_Area.toFixed());
  print(" A = ", areaA.toFixed() ); 
  print(" B = ", bArea.toFixed() ); 
  let fraction = total_intersection_Area / unionArea; 
  print(" F= ",fraction.toFixed(2) );
}
//--------------------------------------------------------------------

function computeIntersectionOfIsovists( isoVA,isoVB )
{
  console.log("computeIntersectionOfIsovists::"); 
  //let isoVA = gMouseIovist; 
  //let isoVB = gSecondMouseIsoVist; 
  let total_intersection_Area = 0 ; 
  let ACCUMULATE = true  ; 
  gInterSectZones = [ ] ; // RESET 
  for( let isovistA_index  = 0 ; isovistA_index < isoVA.length-1; isovistA_index++ )
  {
    for( let isovistB_index = 0 ; isovistB_index < isoVB.length-1; isovistB_index++)
    { 
      total_intersection_Area += 
      processIsovists(isovistA_index,isovistB_index , isoVA, isoVB, ACCUMULATE );
    }
  }
  total_intersection_Area = Math.abs(total_intersection_Area); 
  let areaA  = Math.abs( isovistArea( isoVA )) ; 
  let bArea =  Math.abs( isovistArea( isoVB )) ;
  let unionArea = areaA + bArea - total_intersection_Area; 
  console.log(" overlap area = ", total_intersection_Area.toFixed(5));
  console.log(" A = ", areaA.toFixed(5) ); 
  console.log(" B = ", bArea.toFixed(5) ); 
  console.log(" I = ", total_intersection_Area.toFixed(5) ); 
  let fraction = total_intersection_Area/ unionArea; 
  console.log(" F= ",fraction.toFixed(2) );
  return [  total_intersection_Area , areaA, bArea , unionArea]; 
}

//--------------------------------------------------------------------
let gRunIntersections = false ; 
function runIntersections()
{ 
  if( gRunIntersections == true )increment_triangles(); 
}
//--------------------------------------------------------------------
function loadExampleDocument()
{ 

  loadStrings('./data/billIntelligibileBbox.svg', readSVGFromArrayOfStrings);
  home(); 
}
 //--------------------------------------------------------------------
function distanceVRD(p1, p2) {
  var dx = Math.abs(p1.x - p2.x);
  var dy = Math.abs(p1.y - p2.y);
  return Math.sqrt(dx*dx + dy*dy);
}
 //--------------------------------------------------------------------
function findAverageDensity( list_of_Isovist_points )
{ 
  let totalDist = 0 ; 

    for( let a = 0 ; a <  list_of_Isovist_points.length ; a++ )
    { 
      let fromIso = list_of_Isovist_points[ a ]; 
      for( b = a + 1 ; b < list_of_Isovist_points.length; b++ ) 
      { 
        let toIso = list_of_Isovist_points[ b ]; 
        const d = distanceVRD(fromIso , toIso  );
        totalDist += d ; 
      }
    }
  return totalDist; 
}
 

 //--------------------------------------------------------------------
function errorFromWorker( error )
{ 
  console.assert(false , 'should not be needed'); 
    console.error('Web Worker errorY:', JSON.stringify(error));
    //console.error('Error in worker:', error.message, 'at', error.filename, 'line:', error.lineno);
    console.error(error ); 
}
 //--------------------------------------------------------------------


// const kGRID_isovistGenerator_webworker_src_loc  = "gridIsovistGenertorWorker.js"; 



//----------------------------------------------------------------------------
function GenerateGridIsovsitInteractive()
{
  if( gBuilding_polygons==null || gBuilding_polygons.length ==0  || gBoundingBoxPoly == null )
    { 
      window.alert(" No Building outlines to make isovist from."); 
      updateOutput('Generate Grid cancled.');
      return ; 
    }
  //let  retVal = prompt(" How many isovists in the longest dimension ", "25");
  //print( "User responded "  , retVal ); 

  // webWorkers/gridIsovistGenertorWorker.js 
   //const src =  kWebWorkerFolder+  kGRID_isovistGenerator_webworker_src_loc;  
   console.log("Call Grid " +gGridDensity ); 
   let box = getBoundingBoxVRD( gBoundingBoxPoly );
   
  if( gRegulardGridGEneratorController == null )
  { 
    gRegulardGridGEneratorController = new RegulardGridGEneratorController( gNumberOfProcessors) ; 
  }
  gRegulardGridGEneratorController.generateIsovists( gBuilding_polygons , gBoundingBoxPoly , gGridDensity )

   /*generateAllIsovists( src , gNumberOfProcessors,
     box.x.min,  box.x.max, box.y.min, box.y.max, 5, 
          gBuilding_polygons  , gBoundingBoxPoly ) ; */ 
  //generateGridIsovsit
}
function setGridDensity( newValue )
{ 
  // Check if the new value is a number and greater than 0
  if (isNaN(newValue) || newValue <= 0) {
    console.log('Invalid input! Please enter a number greater than 0.');
    return; // Exit the function if input is invalid
  }

  // Assign the valid value to gGridDensity
  gGridDensity = newValue;
  updateOutput('Grid density set to: ' + gGridDensity);
}
function getCurrentGridDensity()
{ 
  return gGridDensity; 
}
//----------------------------------------------------------------------------
/**
 * user set grid density or grid spaceing 
 */
/* this code does not work - causes time out in Chrome - use a bootstrap one . 

function userEntersGridSpaceing() 
{ 
  let gridSpacing = prompt('Enter the grid spacing (smaller number means denser):', gGridDensity );
  
  // Check if the input is a valid number
  let gridSpacingNum = parseFloat(gridSpacing);

  // Validate the input
  if (isNaN(gridSpacingNum) || gridSpacingNum <= 0) {

    alert('Please enter a valid number greater than 0 for the grid spacing.');// Show an alert if the input is not a valid number or is zero or less
  } else {
    if( gridSpacingNum > 100 )
    { 
      let userResponse = confirm( `${gridSpacingNum} seems a little large are you sure?`);
      if( userResponse == false ) 
        { 
          alert(`Reverting back to ${gGridDensity}`); 
          return ; 
        } 
       console.log( "Grid SPACE=",gridSpacingNum ); 
       updateOutput( `"Grid SPACE= ${gridSpacingNum}`); 

       gGridDensity = gridSpacingNum ; 
    }
  }

}*/ 
//----------------------------------------------------------------------------
/**
 * Over Generate isovists then trime down the result. 
 * @returns nothing 
 */
function Generate_STOCASTIC_IsovsitInteractive()
{ 
  if( gBuilding_polygons==null || gBuilding_polygons.length ==0  || gBoundingBoxPoly == null )
  { 
      window.alert(" No Building outlines to make isovist from."); 
      updateOutput('Generate Grid cancled.');
      return ; 
  }
  //let  retVal = prompt(" How many isovists in the longest dimension ", "25");
  //print( "User responded "  , retVal ); 

  if( gBoundingBoxPoly == null )
  { 
    console.log(" - NO BOUNDING POLY- - "); 
    alert(" No bounding box has been found.\n(Giving up further processing)")
  }else{
    console.log(" - - HAS BOUNDING POLY - - "); 
  }
  // webWorkers/gridIsovistGenertorWorker.js 
  // const sotaticworker = "stocasticIsoGeneratorWorker.js" ; 
   //const src =  kWebWorkerFolder+  sotaticworker;  
   //..console.log("Call Random"); 
  /*
  let box = getBoundingBoxVRD( gBoundingBoxPoly );
  
  generateAllIsovists( src , 8, box.x.min,  box.x.max, box.y.min, box.y.max, 6,
                         gBuilding_polygons , gBoundingBoxPoly ) ; 
  */
  gAllIsovists = []  ; // remove all the old isovists 
  if( gStocastic_grid_generator_controller == null ) 
  { 
    console.log("((((((Setting up controller)))");
    gStocastic_grid_generator_controller = new StocasticGridGeneratorControler( gNumberOfProcessors);
      //see if this works. 
  }
  // Generate isovist down to density. 
  gStocastic_grid_generator_controller.generateIsovists( gBuilding_polygons, gBoundingBoxPoly, gGridDensity ); 
  //GenerateGridIsovsitInteractive() ; 
}
//----------------------------------------------------------------------------
function makePointVRD( hoz, vert )
{ 
  return {x: hoz??0, y: vert??0} ;
}
//---------------------------------------------------------------------------
/**
 * Acesses global gBuilding_polygons 
 *  @@@ TODO this is the fist thing to speed up. 
 * @param {number} hoz 
 * @param {number} vert 
 * @returns boolean True if any point is in or on an isovist.
 */
function isPointInsideAnyBuilding( hoz, vert )
{ 
  let p = makePointVRD( hoz, vert )
  for( const build of gBuilding_polygons )
  { 
    if( pointInVRDPolygon( p, build ))
    return true ;  
  }
  return false  ; 
}
//--------------------------------------------------------------------
function new_or_clear_Document()
{ 
  gBuilding_polygons = [ ]; 
  gBoundingBoxPoly = null ; 
  home(); 
  updateOutput("New (Empty) Document, Sorry Undo not implemented yet");
}
//--------------------------------------------------------------------
/* 
    post off computeDepth to worker 
  1. collect the graph  
  2. 
*/
function  computeDepthFromIsovist( startPoint ) 
{ 
  updateOutput("Compute depth from point - under implemented");
  print("compute depth from ") ; 
}
//--------------------------------------------------------------------
function doStepDepthFrom( index )
{ 
  //console.log(" Do step depth from ", index ); 
  console.assert( index >= 0 , "Index of node cannot be negative"); 

  if( gStepDepthController == null )
  { 
    gStepDepthController = new StepDepthController( gNumberOfProcessors);
    gStepDepthController.sendGraphToWorkers( gAllIsovists ); 
  }
  gStepDepthController.doStepDepthFrom( index ); 
} 

//--------------------------------------------------------------------
/**
 * doTotalDepthFrom  
 * @see  messageRecivedFromGraphWorker for return value  
 * @param {Number} index 
 */
function doTotalDepthFrom( index ) 
{ 
   console.assert( gStepDepthController !=null , ' step depth controler not inialised'); 
   console.assert( Number.isInteger( index ), ' index must be number'+ index);
   gStepDepthController.doTotalDepthFrom( index ) ; 
}

//--------------------------------------------------------------------
/**
 *  setup the workers and 
 *  make a grap of the connections of the isovist s
 *  send to all workers.
 * 
 * the message format is 
 * let graph_worker_setup_message = 
   {
      message: 'LOAD_GRAPH', 
      messageCheck : 0xCAFEBABE,
      graph:  the_graph 
   }; 

   the graph is a list of nodes. 

 * the format is 
 * { 
 *  nodeID: 34 , 
 *  edges[ 43, 33,78,45 ], 
 *  }
 * 
 * RESPNSES IN messageRecivedFromGraphWorker 
 */
function transferGraphToWorkers()
{ 
  //print("Setup graph workers isovist size = " , gAllIsovists.length );
  gStepDepthController = new StepDepthController( gNumberOfProcessors) ; 
  gStepDepthController.sendGraphToWorkers( gAllIsovists ); 
  return ; 
}

//--------------------------------------------------------------------
/**
 * Takes the seletion set gets the first item and does the step depth from it.
 */
function findStepDepthFromSelection()
{ 
  let n = null ; 
  for( let it of gSelectedIsovists)
  { 
    n = it ; break ; // get first 
  }
  if( n ==null )
  { 
    window.alert("Nothing selected or no isovists are computed."); 
    return ; 
  }else
  {
    console.log( "step depth from " + n.ID ); 
    updateOutput("step depth from " + n.ID ); 
    doStepDepthFrom( n.ID ); 
  }

}
//--------------------------------------------------------------------
/**
 * This does old fashioned topological intergration. Notice it
 * 
 * @returns nothing 
 */
function doAllIntergration()
{ 
  console.assert(  gAllIsovists!=null , " Strange "); 
  console.assert( Array.isArray( gAllIsovists), 'Bad'); 
  if(  gAllIsovists.length == 0 )
  { 
    window.alert(" No isovists. Have you generated them?"); 
    return ; 
  }

 // for( const index in gAllIsovists ) will generate strings !!! 
  for (const [index, value] of gAllIsovists.entries())
  {
    console.assert( Number.isInteger( index ), ' not a number '+ index); 
    doTotalDepthFrom( index ); 
  }
}
//--------------------------------------------------------------------
/***
 * 
 */
let gArea_Of_Overlap_workers_TO_DELETE = [ ] ; 
let gNextFree_AreaOfOverlap_worker_TO_DELETE = 0 ; 
let gNumberOfAreaOverlap_calculationsInProgress_TO_DELETE = 0 ; 
let gPeek_gNumberOfAreaOverlap_calculationsInProgress_TO_DELETe = 0 ; 

//--------------------------------------------------------------------
/**
 * @see processAreaOfOverlapfor_TO_DELETE 
 * @param {} isovistTocheck 
 */
/*function processAllAreaOfOverlapCalcsforIsovists_TO_DELETE( isovistTocheck )
{ 
  // console.log( 'isovistTocheck ==' , typeof isovistTocheck); 
  // assertions 
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
    
    processAreaOfOverlapfor_TO_DELETE(isovistA_ID , isoTooID ); 
  }
}*/
//--------------------------------------------------------------------
/*function doAreaOfOverlapFor_TO_BE_DELETED2(  isovistA_ID )
{ 
  const LOCAL = true   ; 
  console.assert( Number.isInteger(isovistA_ID ) , "Isovist-" ); 
  //const isovistA_ID = 20; 
  let isovistA = gAllIsovists[ isovistA_ID ]; 
  console.assert( isovistA != null , " 3274 - "); 
  //console.log(`  doAreaOfOverlapIntergration ${ isovistA.ID } `); 
 

  if( LOCAL )
  { 
    let bIsov = isovistA.getNthConnection(2); 
    console.assert(bIsov !=null , " CONNECTION"); 
    console.log( "B ID =",bIsov.ID ); 
    isovistA.selected = true ; 
    bIsov.selected = true ; 
  //computeIntersectionOfIsovists( isovistA , bIsov); 
    let polyA = isovistA.isovistPolygon; 
    let polyB = bIsov.isovistPolygon; 
    const areaOFA = polygonAreaVRD( polyA ); 
    const aredOfB = polygonAreaVRD( polyB ); 
    const isoA = convertVRDPolygonToIsovistFromCenter( polyA , isovistA.center ); 
    const isoB = convertVRDPolygonToIsovistFromCenter( polyB , bIsov.center ) ; 
    
    let [  total_intersection_Area , areaA, bArea , unionArea] = 
                        computeIntersectionOfIsovists( isoA , isoB );

    console.log( `A = ${areaOFA.toFixed(1)}=, ${areaA.toFixed(1)} `); 
    console.log( `B = ${aredOfB.toFixed(1)} = ${bArea.toFixed(1)} =  `); 
    console.log( ` intersection = ${total_intersection_Area}`); 
  }
  else // USE WEB WORKER 
  { 
    //processAreaOfOverlapfor( isovistA.ID ,  bIsov.ID ); 
   //.... processAllAreaOfOverlapCalcsforIsovists( isovistA );

    isovistA.selected = true; 
  }

}
  */
//--------------------------------------------------------------------
/* @CURRENT  
*/ 
//let gDoing_doAreaOfOverlapIntergration = false ; 
//let gCurrentIsoivst_toArea_Process_TO_DELETE = -1 ; // -1 for no isoivst 
const kMAX_CALCULATIONS_SIMULTANOIUSLY_601 = 601 ; 
/**
 * doAreaOfOverlapIntergration - 
 */
function doAreaOfOverlap_Intersections()
{ 
  updateOutput('Do Overlap Intersections (slow) '); 
  //gDoing_doAreaOfOverlapIntergration = false ; 
  //gCurrentIsoivst_toArea_Process_TO_DELETE = 0 ; 
  //function processAreaOfOverlapfor( isovist_a_ID ,  connectedIsovists_b_ID )
  //for( let isovistA_ID in gAllIsovists )
  //for( let  isovistA_ID = 0 ; isovistA_ID < 20; isovistA_ID+= 1 )
  
 // doAreaOfOverlapFor(gCurrentIsoivst_toArea_Process);
 // gCurrentIsoivst_toArea_Process_TO_DELETE+= 1; 
  console.log("Process Area of overlap "); 
  gAreaOverLp_Cntrlr  = new AreaOfOverlapController( gNumberOfProcessors);

  console.log("Call controller doAreaOfOverlapFor  ");

  //doAreaOfOverlap_Intersections.doAreaOfOverlapFor( 1 , gAllIsovists); 
  gAreaOverLp_Cntrlr.runAreaOfOverlapInBackground( gAllIsovists ); 
}

//--------------------------------------------------------------------
/* function runAreaOfOverlapInBackground__TO_BE_DELETED()
{ 

  if( gDoing_doAreaOfOverlapIntergration == false ) return ; 
  if( gAllIsovists==null )return ; 
  if( gAllIsovists.length == 0 ) return  ; 
  // wait until processing not overloaded. 
  while( gNumberOfAreaOverlap_calculationsInProgress < kMAX_CALCULATIONS_SIMULTANOIUSLY_601 )
  { 
    if( gCurrentIsoivst_toArea_Process < gAllIsovists.length ) 
    {
      doAreaOfOverlapFor(gCurrentIsoivst_toArea_Process);
      gCurrentIsoivst_toArea_Process += 1 ; 
    }
    else{ 
      gDoing_doAreaOfOverlapIntergration = false ; 
      updateOutput('Area of Overlap graph complete.');
      return ; 
    }
  }//
   
}
*/ 

//===================================================================
/**
 * RegulardGridGEneratorController 
 * 
 * I'm not sure how comfortable I am letting this access gobal vars like the 
 * list of isovists. 
 * Might change to make this a class membmer 
 * might improve clarity... 
 */
class RegulardGridGEneratorController extends WorkerCoordinator
{ 
  constructor( numberOfWorkers = 1  , workerScript = null )
  { 
    console.assert(Number.isInteger(numberOfWorkers), 'First arg us number of workers');

    if( workerScript  == null )
      { 
        console.log(" workerScript is null defaulting  ")
        workerScript  = './webWorkers/gridIsovistGenertorWorker.js' ;  
     }

    super( workerScript, numberOfWorkers);
    console.log("Grid Generator Controler - CREATED"+ workerScript);
    this._everyThingRecived = false ; 
    this._numberOfWorkersPosted = 0 ; 
   
  }
  // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
   generateIsovists(   building_polygons,boundingBoxPoly  , spaceing  ) 
    { 
      console.log("Generate_Isovist from From controller ");
      console.log('spcing= ' + spaceing);

      console.assert( boundingBoxPoly!=null ,'Nonnull arg');
      console.assert( isValidVRDPolygon(boundingBoxPoly), 'Arg 1 not polygon'); 
      console.assert( building_polygons!=null , "Null budlings "); 
      console.assert( Array.isArray( building_polygons ), "Second arg null");

      let box = getBoundingBoxVRD( gBoundingBoxPoly );
      //box.x.min,  box.x.max, box.y.min, box.y.max,

      const  workerCount = this.workers.length ; 
      let minXRow = box.x.min;
      let maxRow = box.x.max; 
      let yColMin = box.y.min;
      let  yColMax = box.y.max;

      const wid = yColMax - yColMin ; 
      const hid = maxRow  - minXRow ;
      
      console.log("EST = ", ( wid/spaceing ) * (hid/ spaceing));

      for(let w = 0 ; w < workerCount ; w++) 
      {
        const processFrame = 
          { 
              // this defines the work to do.  
              xRange: { minRw: minXRow ,
                        mxRw: maxRow,
                        spc:  spaceing  }, 
              yRange: { minCol: yColMin , 
                        maxCo: yColMax , 
                        spc : spaceing  },
              maxWorkers: this.numberOfWorkers , 
              workerIdenity: w , 
              buildings:  building_polygons, 
              boundingPolygon : boundingBoxPoly ,  
              isoVistsDensity: 150  // NOTE NO USED see spacing. 
          };
          this._numberOfWorkersPosted += 1 ; 
          console.log("Posting to web worker."); 
          this.postMessageToWorker(w, processFrame);
      }
    }// end 
  // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  /**
   * Note this access the global varaible gAllIsovists. 
   * 
    returnResult = 
    { 
        complete: true , 
        foundIso: isovistsFoundInWorker 
    }; 
   * 
   * @param {} workerIndex 
   * @param {*} info 
   */
  processMessageFromWorker( workerIndex, info )
  { 
    console.log("# remain "+  this.numberOfMessagesBeginProcessed ); 
     
    let isovists = info.foundIso  ; 
    if( !Array.isArray( isovists))
    { 
      console.log( JSON.stringify(isovists)); 
      console.log( JSON.stringify( info));
    }
    for(let  it of isovists ) //console.log(  JSON.stringify(it) ); 
    { 
      let iso = new Isovist( it.x  ,it.y, null  ); 
      gAllIsovists.push(iso); 
      
      //gValidIsovistPoints.push(iso ) ; // My first spread operator 
      //print( it.x, it.y ); 
    }//
    if( info.complete == true )
    { 
      this._numberOfWorkersPosted -= 1 ; 
      if( this._numberOfWorkersPosted ==0 )
      { 
        console.log("PROCESSING GENERATE COMPELTE #= ",gAllIsovists.length ); 
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
  // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  processingComplete()
  { 
    console.log("Processing of grids complete " + this._everyThingRecived  ); 
    processCompleteOK('Isovisit Generators Finished' );
     
    // terminate all workers. 
  }
}
//===================================================================
/**
 * #work 
 *  held in globla instance of gStocastic_grid_generator_controller 
 *   gStocastic_grid_generator_controller= new StocasticGridGeneratorControler( 1  )
 */
class StocasticGridGeneratorControler extends RegulardGridGEneratorController
{ 
  constructor( numberOfWorkers = 1 )
    { 
      super(  numberOfWorkers, './webWorkers/stocasticIsoGeneratorWorker.js') ;
      console.log("StocasticGridGeneratorControler - CREATED"); 
      this._generateFixedNumberOfIsovists = false ;
      this._numberOfIsovists = 0   ; 
    }
    // . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  /**
   *  this allows the user to fix the number of isovists. 
   * @param {number} targetNumberOfIsovists 
   * @param {array of polygons in VRD format } building_polygons 
   * @param {Polygon in VRD format} boundingBoxPoly 
   */
  generate_Fixed_Number_Of_Isovists( targetNumberOfIsovists,   building_polygons,boundingBoxPoly    ) 
  { 
    console.log("Generate_Isovist from From controller");
  // PRECONDITONS 
    console.assert( Number.isInteger( targetNumberOfIsovists), ' - first arg is number of isovists'); 
    console.assert( boundingBoxPoly!=null ,'Nonnull arg');
    console.assert( isValidVRDPolygon(boundingBoxPoly), 'Arg 1 not polygon'); 
    console.assert( building_polygons!=null , "Null budlings "); 
    console.assert( Array.isArray( building_polygons ), "Second arg null");
  // VARIABLES 
    let box = getBoundingBoxVRD( gBoundingBoxPoly );

    const  workerCount = this.workers.length ; 
    let minXRow = box.x.min;
    let maxRow = box.x.max; 
    let yColMin = box.y.min;
    let  yColMax = box.y.max;
    
    const wid = yColMax - yColMin ; 
    const hid = maxRow  - minXRow ;

    const ara = wid*hid ;
    const overProductionFactor = 7. ; 
    const spaceing =  Math.sqrt(  ara/ (targetNumberOfIsovists*overProductionFactor) ); 
    
    const estimate = (wid * spaceing)*(hid*spaceing); 
    console.log("ESTIMATE = ",estimate , " " ,  targetNumberOfIsovists); 
  // ALGORITHUM 
  this._generateFixedNumberOfIsovists = true  ; //remember for later 
  this._targetNumberOfIsovists = targetNumberOfIsovists  ; 
  this.generateIsovists( building_polygons,boundingBoxPoly  , spaceing ); 
    // POST CONDITON 
  }// end 
   //........
    // OVERRIDE 
    /* This needs to be more complex. 
       if the user wants a fixed number of isovists we need to generate 
       more isovists then remove the excess until we get the number we want. 
       depends upon the porosity. 
       If to many randomly remove them. 
    */ 
    processingComplete()
    { 
      if(   this._generateFixedNumberOfIsovists == true)
      { 
         if(  gAllIsovists.length > this._targetNumberOfIsovists) 
         {
          console.log("number of isovists TOO BIG TRIM " +  gAllIsovists.length); 
          gAllIsovists = this.reduceIsovistsEvenly( gAllIsovists, this._targetNumberOfIsovists ); 
          console.log("Final number ", gAllIsovists.length , this._targetNumberOfIsovists);
         }else
         { 
          if( gAllIsovists.length <  this._targetNumberOfIsovists)
          { 
            console.log("TOO FEW  ISOVISTS 🙁" , gAllIsovists.length , this._targetNumberOfIsovists ); 
          }
         }
      }  
      processCompleteOK('Isovisit Generators Finished' ); 
      // terminate all workers. 
    }

    reduceIsovistsEvenly(allIsovists, targetNumberOfIsovists) {
      let totalIsovists = allIsovists.length;
      let numToRemove = totalIsovists - targetNumberOfIsovists;
  
      if (numToRemove <= 0) return allIsovists; // No need to remove if already within limit
  
      let indicesToRemove = new Set();
  
      while (indicesToRemove.size < numToRemove) {
          let index = Math.floor(Math.random() * (totalIsovists - 2)) + 1; // Avoid first and last
          indicesToRemove.add(index);
      }
  
      return allIsovists.filter((_, index) => !indicesToRemove.has(index));
  }


} 
   /* constructor( numberOfWorkers = 1 )
    { 
      super( './webWorkers/stocasticIsoGeneratorWorker.js', numberOfWorkers);
      console.log("StocasticGridGeneratorControler - CREATED"); 
    
    }
      */
   /* generateIsovists(   building_polygons,boundingBoxPoly  , spaceing  ) 
    { 
      print("Generate_STOCASTIC_Isovsit From controller");

      console.assert( boundingBoxPoly!=null ,'Nonnull arg');
      console.assert( isValidVRDPolygon(boundingBoxPoly), 'Arg 1 not polygon'); 
      console.assert( building_polygons!=null , "Null budlings "); 
      console.assert( Array.isArray( building_polygons ), "Second arg null");

      let box = getBoundingBoxVRD( gBoundingBoxPoly );
      //box.x.min,  box.x.max, box.y.min, box.y.max,

      const  workerCount = this.workers.length ; 
      let minXRow = box.x.min;
      let maxRow = box.x.max; 
      let yColMin = box.y.min;
      let  yColMax = box.y.max;

      for(let w = 0 ; w < workerCount ; w++) 
      {
        const processFrame = 
          { 
              // this defines the work to do.  
              xRange: { minRw: minXRow ,
                        mxRw: maxRow,
                        spc:  spaceing  }, 
              yRange: { minCol: yColMin , 
                          maxCo: yColMax , 
                          spc : spaceing },
              maxWorkers: this.numberOfWorkers , 
              workerIdenity: w , 
              buildings:  building_polygons, 
              boundingPolygon : boundingBoxPoly ,  
              isoVistsDensity: 150  // NOTE NO USED. 
          };

          this.postMessageToWorker(w, processFrame);

      }
    }// end 
    */ 

    ///...................
    // OVERRIDE 
    /*
    * This needs more work as we want to fix the number of isovists generated. 
    */
   /* processMessageFromWorker( workerIndex, info )
    { 
      //console.log("RECIVE MESSAGE FROM WORKER (Generate_STOCASTIC_Isovsit ) "); 
      let c = 0 ; 
      for(let  it of info ) //console.log(  JSON.stringify(it) ); 
      { 
        let iso = new Isovist( it.x  ,it.y, null  ); 
        gAllIsovists.push(iso); 
        c++ ; 
        //gValidIsovistPoints.push(iso ) ; // My first spread operator 
        //print( it.x, it.y ); 
      }
     // console.log("Recived  " + c + " Isovists "); 
    }
     */ 
   
   // @@@ TODO the drawing and the removing old code. 
   // @@@ TODO the grid generator. 

//===================================================================
/*
  Graph setup 
  { 
     { node: ID 
       edges: [   ID, edgeE] ]}
      } 
  }

*/ 
class FractionIngrationController extends WorkerCoordinator
{ 
  //......................................
  constructor(numberOfWorkers = 1) {
    super( './webWorkers/fractional_Intergration_wkr.js', numberOfWorkers);
  }
  //......................................
   /* let testGraph = 
    [
        {nodeID:0, weighed_edges:[ [1,0.8], [2,0.2]]}, 
        {nodeID:1, weighed_edges:[ [0,0.8], [3,0.2], [4,.3]]},
        {nodeID:2, weighed_edges:[ [0,0.2], [3,0.2]]} ,
        {nodeID:3, weighed_edges:[ [2,0.2], [1,0.2], [8,.4]]},
        {nodeID:8, weighed_edges:[ [3,0.4], [6,.3], [ 7,.3]]}, 
        {nodeID:4, weighed_edges:[ [1,0.3], [5,0.1] ] }, 
        {nodeID:5, weighed_edges:[ [4,0.1], [6,0.1] ]}, 
        {nodeID:6, weighed_edges:[ [5,0.1], [6,0.1],[1,0.6] ]}, 
        {nodeID:7, weighed_edges:[ [8,0.3]]}
    ] ;
    */
   _convertArrayOfIsovistsToWeightedGraphFormat( listofIsovists)
   { 
      console.assert(listofIsovists!=null, "No null args "); 
      console.assert(listofIsovists.length>0, "No empty lists"); 
      //@@@ TODO CHEck for isovist 
      let theGraph = [ ] ;
      //const iso = gAllIsovists[ 0 ];
      for( let iso of listofIsovists )
      { 
          const node = iso.convertWeightsToWGraphFormat(); 
          theGraph.push( node ) ; 
           if( node.weighed_edges.length == 0 )
          { 
                console.log(`COVNT  NO edges ${node.nodeID} ${iso.connectionCount() }`); 
           }
          
      }
      return theGraph 
   }
  //......................................
  /**
   * 
   * @param {*} thisIsovist 
   */
  doFractionDepthFrom( thisIsovist )
  {
    //console.log("Do depth from "+thisIsovist.ID  ); 
    let theGraph = this._convertArrayOfIsovistsToWeightedGraphFormat(gAllIsovists); 
    console.assert(theGraph!=null , "no graph"); 
    console.info('graph len = ', theGraph.length ); 
    let theGraphSetupMessage  = 
    { 
       messageID: 5924,  
       messageCheck : 0xF1EECE, 
       graph : theGraph  , 
       depthTarget:thisIsovist.ID 
    };

    // send this to all nodes  
    // then send process from node 
    this.tellTheNextFreeWorkerTo( theGraphSetupMessage );
  }
  //......................................
  load_weighted_IsovistGraphOnAllWorkers( )
  { 
    console.info('graph len = ', theGraph.length ); 
    let theGraphSetupMessage  = 
    { 
       messageID: 9313,  // this is not getting throuhg.
       messageCheck : 0xF1EECE, 
       graph : theGraph  , 
       debug_testTarget:0 
    };
    this.postMessageToAll(  theGraphSetupMessage );
  }
  //......................................
  processMessageFromWorker( workerIndex, data )
  { 
   // console.log("MESSAGE FROM WORKER (AREA OVERLAP) "); 
    //console.log( JSON.stringify( data )); 

    if( data.messageID == 'ALL_FACTIONAL_DEPTHS_FOR_RANGE')
    {
      console.assert( data.messageCheck == 0xF1EECE , 'Bad data format'); 
      console.assert( data.depths_table != null , 'No depth table returned'); 
      console.assert(  data.status == 'OK', 'Only process complete');
      
      //console.log(` Rexived  ${data.start} ${data.end}` ); 
      let depthTable = data.depths_table; 
      //console.table( depthTable ); 
      for( let theID of   Object.keys(depthTable) )
        { 
          let iso = gAllIsovists[ theID ]; 
          console.assert(iso.ID == theID , "The isovists have been reordered"); 
          
          iso.asymetricAreaTotalDepth = depthTable[ theID ]??0.0 ;
          iso.currentValue =  iso.asymetricAreaTotalDepth;
          iso.selected = false ; 
        }
      colorByCurrentValue( );
      return ; 
    }
    if( data.messageID == 'STEP_DEPTH_FROM_OK')
    {
      console.log("Yes " + data.measureID  ); 
      console.assert( data.messageCheck == 0xF1EECE , 'Bad data format'); 
      console.assert( data.depth_map != null , 'No depth map returned'); 
      console.assert(  data.status == 'OK', 'Only process complete'); 

      let depthmap =  data.depth_map ; 
      //console.table( depthmap ); 
      for( let theID of   Object.keys(depthmap) )
      { 
        let iso = gAllIsovists[ theID ]; 
        console.assert(iso.ID == theID , "The isovists have been reordered"); 
        iso.currentValue = depthmap[ theID ]??0.0 ; 
        if( iso.currentValue == 0.0 ) 
        { 
          iso.selected = true ; 
        }else iso.selected = false ; 
      }
      colorByCurrentValue();
     
      return ; 
    }
    if( data.messageID == 'LOAD_WEIGHTED_GRAPH_OK')
    { 
      console.log("(((((Recived OK from worker))))))"); // Ignore
      //console.table(data.resultTable ); 
      //console.log("-----------------------------");
      return ; 
    }
    if( data.messageID == 'NO_GRAOH_LOADED_ABORT')
      { 
        console.log("(((((RecivedGRAPJ LOAD ABOS  from worker))))))"); // Ignore
        return ; 
      }
    console.log(`FRAC ${workerIndex}:`, JSON.stringify(data));
  }
  //..........................................
  /* 
      for each worker - 
      give diffrent range + graph to process. 
      LOAD GRAPH + which  to process. Saves syncing 
      When complete terminate all the workers
  */ 
  /**
   * Sends out the message to all the workers to process. 
   *  The work is evenly divided though each one. 
   * called from  @see compute_Fractional_Intergration 
   * calls @see processMessageFromWorker when done. 
   * @param {Array of Isovists } allIsovists 
   * #work #current 
   */
  // METHOD - 
  computeFractionalIntergrationFor( allIsovists)
  { 
    console.log('computeFractionalIntergrationFor START'); 
    console.assert(allIsovists!=null , "No null isovists"); 
    console.assert(allIsovists.length > 1 , "Need multiple isovists to form a graph"); 

    const theGraph = this._convertArrayOfIsovistsToWeightedGraphFormat(gAllIsovists);

    console.assert(theGraph!=null , "no graph"); 
    //console.info('graph len = ', theGraph.length ); 

    const totalItems = allIsovists.length ; 
    const numWorkers = this.workers.length;
    console.assert(numWorkers>0 , 'Zero workers really?'); 
    const itemsPerWorker = Math.floor(totalItems / numWorkers);
    
    for( let n of theGraph )
    { 
      if( n.weighed_edges.length == 0 ) // this is being fired.  
      { 
        console.log(`SRVR NO edges ${n.nodeID}`); 
       }
    }

    //console.log('Iso per worker ', itemsPerWorker); 
    let worker_index = 0 ; 
    for (let worker = 0; worker < numWorkers; worker++) 
    {
      const start = worker * itemsPerWorker; // Calculate the start index for this worker
      let endItem = (worker + 1) * itemsPerWorker - 1;
      if (worker === numWorkers - 1) { // Last worker takes any remaining items
        endItem = totalItems - 1;
        console.log("*** LAST ID TO RPCESS **"+ totalItems); 
      }
      //console.log( "From " , start , " to ", endItem, " WI= ",worker );

      const  CFI4 = 
      { 
        messageID: 7005,  
        messageCheck : 0xF1EECE, 
        graph : theGraph  , 
        startIndex : start , 
        endIndex : endItem
      };
      this.postMessageToWorker( worker , CFI4  ); // 
    }
  }// end of method.
  //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
  processingComplete()
  { 
    colorByCurrentValue();
    console.info("----Coordinator:: ALL processing complete."); 
    processCompleteOK( 'Fractional Intergration complete ' ); // globla function
  }

}// END OF CLASS!!! 
//==================================================================

//--------------------------------------------------------------------
function computeFractionalStepDepth_from_selecion() 
{ 
  console.log("FACTIONAL STEP DEPTH"); 
  if( gFracIntergrationController == null )
  { 
    gFracIntergrationController = new FractionIngrationController( gNumberOfProcessors );
    console.assert(gFracIntergrationController !=null , "Could not make coordinator" ); 
  }
  const iso = gAllIsovists[ 0 ]; 
  
  let n = null ; 
  for( let it of gSelectedIsovists)
  { 
    n = it ; break ; // get first 
  }
  if( n ==null )
  { 
    startModalInputInProgress(); 
     window.alert("Nothing selected or no isovists are computed."); 
    endModalInputInProgress(); 
    return ; 
  }else
  {
    //console.log( "fractional depth from " + n.ID ); 
    updateOutput("fractional from " + n.ID ); 
    gFracIntergrationController.doFractionDepthFrom( n ); 
  }
 // gFracIntergrationController.tellTheNextFreeWorkerTo("Say hello"); 
}
//--------------------------------------------------------------------
/*  */
function compute_Fractional_Intergration()
{ 
  //console.log("---- FACTIONAL INTERGATION (START)----"); 
  if( gFracIntergrationController == null )
  { 
    gFracIntergrationController = new FractionIngrationController( gNumberOfProcessors);
    console.assert(gFracIntergrationController !=null , "Could not make coordinator" ); 
  }
  console.time("computeFractionalIntergration"); 
  gFracIntergrationController.computeFractionalIntergrationFor( gAllIsovists); 
  console.timeEnd("computeFractionalIntergration"); 
  //console.log("Fractional intergration complete");
}
//------------------------------------------------------------------
function validateFilename(name) {
  if (name.length === 0)
  {
    return false;
  }

  // Define a regex for illegal filename characters
  const illegalChars = /[\\/:"*?<>|]+/;
  return !illegalChars.test(name);
}
//--------------------------------------------------------------------
/**
 * Prompts the user for a filename and exports the current view as an SVG.
 *
 * This function:
 * 1. Asks the user to input a name for the SVG file.
 * 2. Validates the input to ensure it's a valid filename.
 * 3. Calls `exportCurrentViewAsSVG` with the validated filename.
 * @author ChatGPT 
 * @function exportCurrentViewAsSVGAskUserForName
 * @returns {void}
 */
function exportCurrentViewAsSVGAskUserForName()
{
  // Prompt message
  const promptMessage = "Enter a name for your SVG file:";

  // Display the prompt with a default filename
  const defaultName = "myDrawing";
  const userInput = prompt(promptMessage, defaultName);

  // Check if the user canceled the prompt
  if (userInput === null) {
    console.log("SVG export canceled by the user.");
    return; // Exit the function without exporting
  }
  const trimmedInput = userInput.trim();

  // Validate the input: non-empty and does not contain illegal characters
  const isValid = validateFilename(trimmedInput);
  if (!isValid) {
    alert("Invalid filename. Please avoid using characters like / \\ : * ? \" < > |");
    return; // Exit the function without exporting
  }

  const filename =  trimmedInput.replace('.svg', '');// remover .scg 

  // Call the export function with the validated filename
  exportCurrentViewAsSVG(filename);
}
//--------------------------------------------------------------------
function exportBuildingAsSVG( building )
{ 
  //<polygon points="100,100 150,25 150,75 200,0" fill="none" stroke="black" />
  let polygn = '<polygon points="'; 
  for( const vx of building  )
  { 
    //console.log( vx.x , vx.y  ); 

    polygn = polygn + `${vx.x} ,${vx.y}  `; 
  }
  polygn = polygn + `" fill =  "${kBuildingFill}" />`; 
  return polygn ; 
}
//--------------------------------------------------------------------
/* Exports the current view as an SVG file with the given filename.
*
* This function:
* 1. Gathers the SVG content as an array of strings.
* 2. Saves the SVG using p5.js's `saveStrings` function.
*
* @function exportCurrentViewAsSVG
* @param {string} filename - The name of the SVG file to save.
* @returns {void}
*/
function exportCurrentViewAsSVG(filename) 
{
  let svgLines = [ `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`, 
    `<title id="svgTitle">Isovists Coloured by ${gCurrentMeasure}</title>`, 
    `<desc id="svgDesc">A cluster of coloured dots representing points in space </desc>`, 
    `<rect width="100%" height="100%" fill="black" />`, 
    ` <text x="10" y="${height}-14" font-family="Arial" font-size="9" fill="darkgrey">
      Made with Omnivista V0.9 beta release. 
  </text> `,
    ` <text x="10" y="50" font-family="Arial" font-size="24" fill="white">
     Isovists Coloured by ${gCurrentMeasure}
  </text> `, 
    
  ]; //gCurrentMeasure

  /*
 do buildings.... he he he .
  <polygon 
    points="100,10 40,198 190,78" 
    fill="#e74c3c" 
    stroke="#333" 
    stroke-width="2"
    style="cursor: pointer;"
  />
  */ 
  /*<!-- Layer 1: Background -->
  <g id="layer1">
    <rect width="100%" height="100%" fill="lightblue"/>
  </g>*/ 

  // add in all the building, 
  // add in all the isovists. 
  
  svgLines.push( `<!-- Building --> ` ); 
  for( let bld = 0 ; bld < gBuilding_polygons.length ;bld++)
  {
    let building = gBuilding_polygons[ bld ]; 
    svgLines.push( exportBuildingAsSVG(  building  ) ) ; 
  }
  svgLines.push( `<!-- End of building --> ` );
  let config = { } ; 
  for( let iso of gAllIsovists )
  { 
    svgLines.push(  iso.exportToSVGString( gISOVIST_DRAW_CONFIG )); 
  }
  let lastLine = `</svg>` ; 
  svgLines.push(lastLine ); 
  saveStrings(svgLines, filename, '.svg');
}
//---------------------------------------------------------------
function exportTableAskForName()
{
  // Prompt message
  const promptMessage = "Enter a name for your SVG file:";

  // Display the prompt with a default filename
  const defaultName = "Omnivista_Table";
  const userInput = prompt(promptMessage, defaultName);

  // Check if the user canceled the prompt
  if (userInput === null) {
    console.log("SVG export canceled by the user.");
    return; // Exit the function without exporting
  }
  const trimmedInput = userInput.trim();

  // Validate the input: non-empty and does not contain illegal characters
  const isValid = validateFilename(trimmedInput);
  if (!isValid) {
    alert("Invalid filename. Please avoid using characters like / \\ : * ? \" < > |");
    return; // Exit the function without exporting
  }

  const filename =  trimmedInput.replace('.csv', '');// remover .scg 

  // Call the export function with the validated filename
  exportTable(filename);
}
//---------------------------------------------------------------
function exportTable( filrNmr)
{ 
  console.log(" SAVE FILES"); 
  let lines = [ "header,0,0,0"]; 
  for( let iso of gAllIsovists )
  { 
    lines.push(  iso.getTableAsString());
  }


  saveStrings(lines, filrNmr, '.csv');
}
//---------------------------------------------------------------
/* PLAN
    EXPORT TABLE - all values of all the isovists 
    VIEW TABLE - see all the values of all the numbers. 
    VIEW SCATTERGRAM - interactve scacter gram... as a view 

    SELECTION - need tools so we can link one group of isovists to another.
 * 
 */
//====================================================================
function deleteSelection()
{ 
  console.log("Delete key was pressed!");
  gAllIsovists = gAllIsovists.filter(item => !gSelectedIsovists.has(item));
}
//--------------------------------------------------------------------
/**
 * Flip between color and  black and white
 * Infuture might change 
 */
function nextColorDisplayMode()
{ 
  if( gColorByIsColor == 0 ) 
    { 
      gColorByIsColor = 1 ; //black and white 
    }else
    { 
      gColorByIsColor = 0 ;  // colour 
    }
    //console.info(' color by ' + gColorByIsColor); 
    colorByCurrentValue(); 
}
//--------------------------------------------------------------------
function generate_fixed_number_of_isovists()
{ 
  setFixedNumberOfIsovists( 2909 ); //  gFixedNumberOfIsovists = 9000 ; // em


  gAllIsovists = []  ; // remove all the old isovists 
  if( gStocastic_grid_generator_controller == null ) 
  { 
    console.log("((((((Setting up controller)))");
    gStocastic_grid_generator_controller = new StocasticGridGeneratorControler( gNumberOfProcessors);
      //see if this works. 
  }
  // Generate isovist down to density. 
  gStocastic_grid_generator_controller.generate_Fixed_Number_Of_Isovists(
    getFixedNumberOfIsovists(), 
     gBuilding_polygons, gBoundingBoxPoly, gGridDensity ); 
  
}

//--------------------------------------------------------------------
/**
 * Random walk. 
 * Basically moves from node randomly. 
 * To avoid getting stuck jumps to another point randomly ( or perhaps does everyone 
 * a few hundred times?)
 *  Possibly works in the background. 
 *  do100() do 100 steps from not to node   
 * 
 */

/**
 *  choice_betweeness()
 *  start from every where. go to every where. 
 *  follow_you_nose_choice 
 *  look at at angles. 
 */
/**
 * Label finding - find 'rooms' by looking for cluseters. 
 */
/**
 * cluster coefficent. 
 */
//--------------------------------------------------------------------
/**
 *  this computes the power value for nodes in a graph. 
 *  as far as isovists go I'm not impressed. 
 *  Can use Katz version to get something like radius.
 * 
 * Needs a version which works with weights.  
 * @returns nothing 
 */
function doEigenVector() 
{ 
  print("Eigen Vector");
  if( gAllIsovists == null || gAllIsovists.length < 3 || gAllIsovists[0].hasIsovist == false  )
    { 
      startModalInputInProgress(); 
        doAlert("You need to generate isovists first ( try command/control R)"); 
      endModalInputInProgress(); 
      return ; 
    }
    for( let iso of gAllIsovists )
    {
        iso.setEigenPower(1.0 ) ;  // level 1 is connectivity. 
     }
    console.log("Compute powers "); 
    let depthMap = new Map() ; 
    let eMergencyExit = 0; 
    let previousValue = -1 ; 
    let currentValue = -1  ; 
    do{ 
      let maxValue = -10 ; // have to be careful first time through loop. 
      depthMap = new Map() ; 
      previousValue = currentValue ;
      for( let iso of gAllIsovists )
      {
        const newPower  = iso.computePowers( gAllIsovists );
        console.assert( Number.isFinite( newPower ), 'arg not number' + newPower); 
        depthMap.set(iso, newPower  ) ;  // level 1 is connectivity. 
        if( newPower> maxValue) maxValue  = newPower ; 
      }
      console.assert( maxValue!= 0.0); 
      for( let iso of gAllIsovists )
      { 
        iso.setEigenPower(depthMap.get( iso )/ maxValue ) ; // update. 
      }
      console.log("Getting all values. max=", console.log(gAllIsovists[ 0 ].getEigenPower().toFixed(4)) ); 
      currentValue = gAllIsovists[ 0 ].getEigenPower(); 
      if( eMergencyExit++ > 10000 )break ; 
    }while( Math.abs(currentValue - previousValue) >= 0.0001 ) ; 
    
    console.log("done.")
    for( let iso of gAllIsovists )
    {
     //  console.log( "->", iso.getEigenPower().toFixed(3), -iso.connectivity  ); 
        iso.currentValue = - iso.getEigenPower() ; 
    }
    colorByCurrentValue( );
}
//--------------------------------------------------------------------
/**
 *    1. Load file 
 *    2. 'r' to process 
 * 
 *    Looks like safari blocking Shift R.
 * 
 *    TODO 
 *    5. 'a' area to work out area overlaps 
 *    6. 'd' to do depth from all nodes to all others 
 *    
 * @returns 
 */

function keyPressed() 
{

  
  if( isModalInputInProgress() )return ;
  if( key == 'c')
  { 
    console.log( "-----------Choice------------ "); 
    doDirectedAreaOverlapChoice(); 
    return ; 
  }
  if( key == 'E' )
  { 
      doEigenVector(); 
    return ; 
  }

  if( key =='§')
  { 
    nextColorDisplayMode(); 
    return  ; 
  }
   //print("Key pressed " + key + " " +  keyCode ); 
  if (keyCode == BACKSPACE ) 
  {
    deleteSelection(); 
    return ; 
  }

   if( key == 'r')
    { 
     //Generate_STOCASTIC_IsovsitInteractive(); // triggers sequnce 
     /// 0 Generate_STOCASTIC_IsovsitInteractive
     /// 1 computeAllIsovistsFast(); 
     /// 2 doIsovistIntersections() 
     /// 3 transferGraphToWorkers() 
     /// 4  doAllIntergration(); 
     //startSequence();
     start_stocastic_sequence(); 
     return ; 
    }
    /*if( key == 'd')
      { 
        userEntersGridSpaceing(); 
        return ; 
      } */ 
  if( key == 'f')
  { 
    console.log("fixed number of isovists"); 
    generate_fixed_number_of_isovists(); 
    return ; 
  }

   if( key == 'e')
   { 
      exportCurrentViewAsSVGAskUserForName(); 
      return 
   }
   if( key == 'm')
   { 
    askUserForMaxRadius(); return ; 
   }
   if( key == 'i')
   {
    compute_Fractional_Intergration() ; 
    return ; 
   }

   if( key == 'd' )
  {
     computeFractionalStepDepth_from_selecion(); 
     return ;
  }
   if( key == 'a' )
   { 
    //
    //doAreaOfOverlapIntergration
     doAreaOfOverlap_Intersections(); 
     return ; 
   }
   if( key =='D')
   {
    findStepDepthFromSelection(); 
    return ; 
   }
   
   if( key == 't')
   { 
    transferGraphToWorkers( ); 
    return true ; 
   }
   if( key == 'x')
   { 
    print("intersect all isovists  "); 
    computeAllIsovistsFast(); 
    return true ; 
   }
   if( key == 'g')
   { 
    GenerateGridIsovsitInteractive(); 
    // generateGridIsovsit(); - check version .
    return true ; 
   }

   if( key == 'u'){  Generate_STOCASTIC_IsovsitInteractive(); return true ; }

   if( key == 'h')
   { 
    home(); 
    updateOutput("Home [h]");
    return true; 
   }
   if( key == 'o')
   { 
    print(" OPEN"); 
    doOpen(); 
    return true ; 
   }
   if( key == ' ')
   { 
    increment_triangles(); 
    return true; 
   }
    if( key == 'b'){  addBuildingsBoundingBox(); return true ; }
   if( key == 'C')
   { 
    computeIntersectionOfIsovists_OLD(); 
    return true; 
   }
   if( key == ';')
   { 
      doIsovistIntersections(); 
      updateOutput('Run intersections'); 
      transferGraphToWorkers( );
      doAllIntergration() ; 
      return true; 
   }
   /*if( key == 'x') // debug insovist overlap. 
   { 
    gRunIntersections = !gRunIntersections ;
    updateOutput('Run intersections');  
    return true; 
   }*/
   if( key == '=') { zoomInToMap() ; return ;  }
   if(key == '-'){ zoomOutMap(); return ;  }
   /*
   if(keyCode == UP_ARROW ) 
   { 
    gLast_trigangle += 1; 
    if( gLast_trigangle > gMouseIovist.length-1 )
      gLast_trigangle = gMouseIovist.length-1;
    print("up " +gLast_trigangle ); 
    processIsovists(gMDown_triangle ,gLast_trigangle,gMouseIovist, gSecondMouseIsoVist ); 
    return ; 
   }
   if( keyCode == DOWN_ARROW )
   { 
    gLast_trigangle -= 1 ; 
    print("Down " +gLast_trigangle ); 
    if( gLast_trigangle < 0 ) gLast_trigangle = 0 ; // camp 
    processIsovists(gMDown_triangle ,gLast_trigangle,gMouseIovist, gSecondMouseIsoVist ); 
    return ; 
   }
  if( keyCode == LEFT_ARROW)
  { 
    gMDown_triangle += 1; 
    if( gMDown_triangle > gSecondMouseIsoVist.length-1) 
      { 
        gMDown_triangle = gSecondMouseIsoVist.length -1 ; 
      } 
    print("left " + gMDown_triangle ); 
    processIsovists(gMDown_triangle ,gLast_trigangle , gMouseIovist, gSecondMouseIsoVist); 
    return true  ; 
  }
  if( keyCode == RIGHT_ARROW )
  { 
    gMDown_triangle  -= 1; 
    if( gMDown_triangle < 0 )gMDown_triangle = 0 ; 
      //gMDown_triangle = gSecondMouseIsoVist.length -1 ; 

    print("right"+ gMDown_triangle ); 
    processIsovists(gMDown_triangle ,gLast_trigangle,gMouseIovist, gSecondMouseIsoVist ); 
    return true  ; 
  }

  if (key === ' ' && gDebugTRIANGLE_INTERSECTIONS ) {
    test_Triangle_Intersection_VRD(true); 
     //console.log( gDebug_result );   
  }
  if( key == 'd' && gDebugTRIANGLE_INTERSECTIONS )
  { 
    console.log( JSON.stringify(gDebug_result) ); 
    console.log( JSON.stringify(gDebug_TriA)  ); 
    console.log( JSON.stringify(gDebug_TriB) ); 
    console.log( JSON.stringify(gDebug_cross_pts) ); 
    return true ; 
  }*/ 

  if( key == 'q' ) 
   { 
    showQuadTree(); 
     return true ; 
   } 
  return false ; 
}
//--------------------------------------------------------------------

/* 

d
* 
      //updateOutput(""+ QuadTree.INTER_SECT_COUNT  );  

  /*
  gRay.pe = new flatten.Point( lstMouseX , lstMouseY  ); 

  if( gQuadTree != null )
  { 
    QuadTree.debug_intersection_info = new Map(); 
    QuadTree.INTER_SECT_COUNT = 0 ; 
    print("Trimming ray" , gRay.length ); 
    gQuadTree.trimRay( gRay ); 
    print("Trimed", gRay.length, " Interect count = ", 
      QuadTree.INTER_SECT_COUNT ," / ", someSegments.length   ); 
  }*/ 
   /* DOES NOT WORK 
     // let [res_poly, wrk_poly] = flatten.booleanOpBinary(gIsoVistPolygon, gSecondIsovistPolygon, flatten.BOOLEAN_INTERSECT, true);
      
     // gBothIntesect = flatten.intersect(gIsoVistPolygon,gSecondIsovistPolygon  ); 
     gBothIntesect =  gIsoVistPolygon.intersect(gSecondIsovistPolygon);// works
     console.log(typeof gBothIntesect); 
     //
     // let px = flatten.calculateIntersections( gIsoVistPolygon,gSecondIsovistPolygon ); 
     // not intersection , not interset 
     //let px = flatten.BooleanOperations.intersection(gIsoVistPolygon,gSecondIsovistPolygon ); 
      // intersect is not a function. 
     //let px = flatten.intersect(gIsoVistPolygon,gSecondIsovistPolygon ); 
     // updateOutput(" Area = "+ gBothIntesect.area().toFixed(2) +    " e="+  gBothIntesect.isEmpty() );
      //unify(polygon1, polygon2) 
      */
/*
A Worker controler controls a worker 
class WorkerControl
{ 
  constructor() 
  { 
    this.workers = [ ];  //
    this.itemsBeingProcessed = 0 ; 
    this.maxItemsToPRoess = 0 ; 
    this.callNextWhenDone ; 
    this.error 
    this.workerFinished ; // use bind to make this work correct.y 

  }
  stop()
  { 
  }
  shutDown() 
  { 
  }

  drawComplet() 
  { 
  }

}


*/ 
//--------------------------------------------------
/**
 * @see gColorByIsColor  - global value for colour 
 * 
 * @returns 
 */
function colorByCurrentValue()
{ 
  console.assert( gAllIsovists != null , "No isovists"); 
 if( gAllIsovists.length < 1) return ; 

 let minVal = Number.POSITIVE_INFINITY; 
 let maxVal = Number.NEGATIVE_INFINITY;

 for( let it of gAllIsovists )
 { 
  const  val = it.currentValue; 
  if( ! Number.isNaN( val ) )// NAN indicates no value. 
  { 
    if(  Number.isFinite( val ) )
    {
      minVal =  Math.min( val  , minVal ) ; 
      maxVal =  Math.max( val , maxVal );
    }
  } 
 }
 gISOVIST_DRAW_CONFIG.gMinValue = minVal ; 
 gISOVIST_DRAW_CONFIG.gMaxValue = maxVal ; 
 gISOVIST_DRAW_CONFIG.gTop10  = lerp( minVal , maxVal , 0.1); 
 gISOVIST_DRAW_CONFIG.gBotom10 = lerp( minVal , maxVal , 0.70); 
 gISOVIST_DRAW_CONFIG.gRangeSet = true ; 
 console.log("∂=",
  gISOVIST_DRAW_CONFIG.gMinValue.toFixed(2),
  gISOVIST_DRAW_CONFIG.gTop10.toFixed(2),
   gISOVIST_DRAW_CONFIG.gBotom10.toFixed(2), 
   gISOVIST_DRAW_CONFIG.gMaxValue.toFixed(2) );
 
 console.assert( minVal <= maxVal , " numbers broken"); 
 updateOutput(`Range ${minVal} ... ${maxVal}`)
 for( let it of gAllIsovists )
 { 
  it.colorByCurrentValue( minVal,maxVal , gColorByIsColor ); 
 }
 if(  gColorByIsColor == 0 ) 
 { 
  gBackgroundColor = color('black'); 
 }else 
 { 
  gBackgroundColor = color('white'); 
 }
}
//--------------------------------------------------
/**
 * colorByMeasure given the name of the current measure 
 * must be 
 * @param {string} measureID 
 */
let gCurrentMeasure = "Non"; 
function colorByMeasure(  measureID , multiplyer = 1 )
{ 
  console.log(` DO MEASURE  '${measureID}'  `) ; 
  if( gAllIsovists.length < 1 )return ; 
  
  let iso = gAllIsovists[ 0 ]; 
  if( iso.hasOwnProperty[ measureID ] == false )
  { 
    console.log(` ${measureID} No such property..`); 
    return ; 
  }
  gCurrentMeasure = measureID ; 
 
  console.log(  iso[  measureID ], Number.isFinite( iso[  measureID ] )); 
  if(  Number.isFinite( iso[  measureID ] ) == false)
  {
    console.log( measureID, ' - IS NOT FINITE - giving up');
    return;
  }
  let minval = gAllIsovists[0][measureID ]?? 0.0; 
  let maxval = minval ; 
  for(let iso of gAllIsovists) 
  {
    const valu = iso[ measureID ]?? 0.0 ;
    iso.currentValue =  multiplyer * valu  ; 
    if( minval > valu){ minval = valu;}
    if( maxval < valu){ maxval = valu;}
  }

  colorByCurrentValue();
  updateOutput('Current Color '+  measureID + ' ' + minval.toFixed(2)+':'+ maxval.toFixed(2)) ;
}
//--------------------------------------------------
/**
 * This toggles the show connections. 
 */




  /*
  console.log( 'Value --> ',  iso.perimeter ); 
  console.log( ' '+   iso[ 'perimeter' ] ) ; 
  console.log( "value ..." , iso[ measureID ]);
  */
//--------------------------------------------------
/**
 * draw Web Worker Info
 */
function drawWebWorkerInfo()
{ 
  function drawIndicator( stage, current, maxval)
  { 
    if( maxval == 0 ) maxval = 1 ;
    const r =  ((height/2) -150) +  (stage * 20)  ; 
    let angle =   current * (2 * PI) / maxval ; 
    noFill(); 
    arc( width/2, height/2, r, r,  angle ,0  );
  }
  //gIsovistGeneratorWorkersComplete
  strokeWeight(5); 
  //gPeak_gIsovistGeneratorWorkersInAction 
  /*
  if( gIsovistGeneratorWorkersInAction> 0 ) 
  { 
    stroke(pallet[3]); 
  
    line( 5, 5,  gIsovistGeneratorWorkersInAction* 20  , 5 ); 
    line( 5, 5,  gGraphWorkersSetupInprogress* 20  , 5 ); 
    drawIndicator( 1, gIsovistGeneratorWorkersInAction, gPeak_gIsovistGeneratorWorkersInAction )
  } 
  */ 
  /*if( gIsovistsWaitingToBeRecivedFromMakeIsovistFrom > 0 ) 
  { 
    stroke(pallet[4]); 
    //gIsovistGeneratorWorkersInAction
    line( 5, 10, gIsovistsWaitingToBeRecivedFromMakeIsovistFrom , 10 ); 
    drawIndicator( 2,  gIsovistsWaitingToBeRecivedFromMakeIsovistFrom, 
      gPeek_gIsovistsWaitingToBeRecivedFromMakeIsovistFrom ); 
    
  }*/ 
  if( gStepDepthController!=null )
  { 
    stroke(pallet[0 ]); 
    gStepDepthController.drawCurrentStaus(); 
  }
  /*if( gGraphWorkersProcesses > 0 )
  { //gPeak_gGraphWorkersProcesses  );
    stroke(pallet[0]); 
    strokeWeight(5); 
    // line( 5, 15,  gGraphWorkersProcesses / 2   , 15 ); 
   noFill(); 
   
   //gPeak_gGraphWorkersProcesses 
     // let angle =   gGraphWorkersProcesses * (2 * PI) / gPeak_gGraphWorkersProcesses 
     // arc( width/2, height/2, (height/2) -80, (height/2) -80,  angle ,0  ); 
     drawIndicator( 3, gGraphWorkersProcesses,gPeak_gGraphWorkersProcesses);
  }*/ 
  // #here 

  if( gAreaOverLp_Cntrlr!=null && gAreaOverLp_Cntrlr.isRunningInBackgrond == true  )
  { 
    stroke(pallet[2]); 
    gAreaOverLp_Cntrlr.drawCurrentStaus();
    /*strokeWeight(5); 
    line( 5, 20,  areaOverLp_Cntrlr.numberOfAreaOverlap_calculationsInProgress / 3   , 20 ); 
    drawIndicator( 5 , areaOverLp_Cntrlr.numberOfAreaOverlap_calculationsInProgress,
      AreaOfOverlapController.kMAX_CALCULATIONS_SIMULTANOIUSLY_601);
  
    noStroke( ); 
    fill( 255 ); 
    text("D="+areaOverLp_Cntrlr.numberOfAreaOverlap_calculationsInProgress , width/2, height/2 ); 
    */ 
    }

  /*if( gDoing_doAreaOfOverlapIntergration  )
  { 
    noStroke( ); 
    fill( 127 ); 
    text( `#= ${gCurrentIsoivst_toArea_Process}::${gAllIsovists.length} ` ,  5, 85  );
    stroke(pallet[0]);
    drawIndicator( 4 , gCurrentIsoivst_toArea_Process,gAllIsovists.length); 
  }
    */
  
  if ('performance' in window && 'memory' in window.performance)
  {
    noStroke( ); 
    fill( 127 ); 
    const memory = window.performance.memory;
    text(`Total JS heap size: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(0)} MB`, 5, 120 );
   // text(`Used JS heap size: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(0)} MB`, 5, 140 );
    
    text(`JS heap size limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)} MB`, 5,140 );
    text(`Selection ${gSelectedIsovists.size}`, 5 , 160 ); 
  } 
  //if( drawWebWorkerInfo )
  if(gFracIntergrationController != null )
  { 
    stroke(pallet[0]);
    line( 50, 4, 100, 4 ); 
    gFracIntergrationController.drawCurrentStaus(); 
  }
  if( gRegulardGridGEneratorController != null ) 
  { 
    stroke(pallet[0]);
    gRegulardGridGEneratorController.drawCurrentStaus() ; 
  }
  if( gStocastic_grid_generator_controller != null )
  { 
    stroke(pallet[1]);
    gStocastic_grid_generator_controller.drawCurrentStaus(); 
  }
  
  if( gIsovistGeometryController != null )
  { 
    stroke(pallet[2]);
    gIsovistGeometryController.drawCurrentStaus(); 
  }
}
//---------------------------------------------------
/*

Space Mono / Share Tech Mono 
  Dagrek font. ? (Fat) 
  Quicksand 
  Libre Barcode 39 Extended
  Indie Flower
  Concert One ( fat )
*/ 
function draw() {
  background(gBackgroundColor);
  textFont([ 'Courier', 'Helvetica','Arial', 'monospace', 'sans-serif']);
  
  smooth();
  push();
    translate(fOffSetX, fOffSetY);
    scale(fZoomFactor, fZoomFactor);
    drawScaled();
  pop();
  drawWebWorkerInfo(); // draw on top of everything else 
  if( gfileDropInProgress == true )
  { 
    stroke( 0,0,255); 
    strokeWeight(2); 
    noFill(); 
    rect( 1,1, width-2, height-4); 
    noStroke();
    //strokeWeight(1); 
    textSize(30);
    fill( pallet[ 2]) ; 
    text(" I Accept files of type SVG ", 30, 30 ); 
  }
  if( gDisplayMessage != null )
  { 
    push(); 
      noStroke(); 
      fill( 64 , 128 ); // level of grety 
      rect( 10, 50 , width -100, height - 100  ); 
      textSize( 32 ) ; 
      textAlign(CENTER, CENTER);
      noStroke(); 
      fill( 255);
      text( gDisplayMessage, 10,5 , width - 10 , height-100 ); 
    pop(); 
  }
}
//---------------------------------------------------
function preload() 
{
  if( true )
  { 
   loadStrings('./data/BarnsburyIsoBlocks2.svg', readSVGFromArrayOfStrings);
    gGridDensity = 5 ; 
  } else{ 
  
  loadStrings('./data/billIntelligibileBbox.svg', readSVGFromArrayOfStrings);
   gGridDensity = 15 ; 
  } 
}
//---------------------------------------------------
function doOpen()
{ 
  let fileInput = createFileInput(handleFile);
  fileInput.position(10, 10);  // Position the file input on the canvas
}
let gLoadFilename = null ; 
//---------------------------------------------------
function handleFile(file) {
  //.. print("Handling file. no honestly" , file.type );
  //.. print("Data = ", file); 

  if( file.file !== undefined && 
      file.file.type !== undefined && 
      file.file.type  == 'image/svg+xml' )
  { 
    //print(" file. ", file.file ); 
    //print(" file.file.type", file.file.type); 
    //print("WE HAVE IT ");
    if(  file.file.name !== undefined )
    { 
      gLoadFilename = file.file.name ; 
      updateOutput("Trying to read  " + gLoadFilename); 
    }
    loadStrings( file.data , readSVGFromArrayOfStrings);
  }
  
  if (file.type === 'image') 
  {
   // file.
    // If the file is an image, load it and display it on the canvas
    //let img = createImg(file.data, '');
    //img.hide();  // Hide the image element (we'll draw it manually)
    //image(img, 0, 0, width, height);  // Draw the image on the canvas
  } else 
  {
    updateOutput('Not an image file'); 
    console.log("Not an image file.");
    console.log("handleFile:: type = ", file.type); 
  }
  gfileDropInProgress= false;
}
//---------------------------------------------------
function handleDrop(event)
{
  print("Handle drop + ", event);
} 
//---------------------------------------------------
function handleFileDraggedOver( ){ 
  gfileDropInProgress= true ; 
}
function handleFileLeft()
{ 
  gfileDropInProgress= false ; 
}
//---------------------------------------------------
/**
 * READ SVG data in from file - do we handle/read layers? 
 * do we read all layers( I guess so ) 
 * do we keep the polygons? I think we need to so we can 
 * determine if an isovist is within a wall.
 * @param {array of strings} data 
 * @returns 
 */
function readSVGFromArrayOfStrings(data) 
{
  //print("I read"); 
  if( data == null )
  { 
    print("Cannot Read null data"); 
    return ; 
  }
  console.log(" " + data.length ); 
  console.log( typeof data[ 0 ] ); 
  let svgText = data.join(' ');
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
  //console.log( JSON.stringify( svgDoc, null , 2 ) ); 
  //console.log(doc.getElementsByTagName("name")[0].textContent);
  //updateOutput( data); 
  // could get layers 
  const polygonsVRD = [ ] ; 
  const processedAlreay = [ ];
  let groups = svgDoc.getElementsByTagName("g");
  //print("----GRPS----");
  //print(" GROUPS == ", groups.length ); 
  for( let g = 0 ; g < groups.length  ; g++ )
  { 
    let grp = groups[ g];
    let nme = grp.getAttribute("id"); 
    let paths = grp.getElementsByTagName("path");
    //print("Doing group ", g , " ", nme);

    // Loop through and log each <path> element
    for (let i = 0; i < paths.length; i++) {
      const commands = [];// Each shape is a polygon. 
      let src = paths[i].getAttribute("d"); 
      //print('-------');
      //print(src); 
      if( src == null )
      { 
        print("Skipping", i); 
        continue; 
      }
      const regex = /([a-df-zA-DF-Z])([^a-df-zA-DF-Z]*)/g;
      let match; 
      let polyVRD = null ; 
      while ((match = regex.exec(src)) !== null) {
        const command = match[1];
        const coords = match[2].trim().split(/[\s,]+/).map(Number);  // Split by space or comma, and convert to numbers
        
        //commands.push({ command, coords });
        
        if( command == 'M')
        { 
          // print("M " , coords[ 0] , coords[1 ] );
          console.assert( polyVRD == null  , 'Starting polyong when previsous not finished.')
          let place = { x:coords[ 0] , y:coords[1 ]}; 
          polyVRD = [ place ] ; 
          continue ; 
        }
        if( command == 'L')
        { 
          // print("L " , coords[ 0] , coords[1 ] );
          console.assert( polyVRD != null, "adding to undstarted");
          let place = { x:coords[ 0] , y:coords[1 ]}; 
          polyVRD.push( place ); 
          continue ; 
        }
        if( command == 'C')
        { 
          //print("C " , coords[ 4] , coords[5 ] );
          console.assert( polyVRD != null, "adding to undstarted");
          let place = { x:coords[ 4] , y:coords[5 ]}; 
          polyVRD.push( place ); 
          continue ; 
        }
        if( command == 'z')
        { 
          //print(i, " Add building sides =" , polyVRD.length);
          polygonsVRD.push(  polyVRD );
          polyVRD = null ; 
          continue; 
        }
        print("Uknown command during read " , { command, coords }  ); 
      }
      if( polyVRD != null)
      { 
        //print(i, " Add building sides =" , polyVRD.length);
        polygonsVRD.push(  polyVRD );
        polyVRD = null ; 
      }
      //  console.log();  // Log the "d" attribute, which defines the path
    }// END FOR 
    //print("READER END OF GROUP" , g ); 
  }// End for groups.
  //print("Buildings added = ", gBuilding_polygons.length ); 
  //gBuilding_polygons = polygonsVRD;
  loadbuildingsFromPolygons(polygonsVRD ); 
  home(); 
}
//---------------------------------------------------
function go_full_screen() 
{ 
  let fs = fullscreen();
  updateOutput("Full screen")
  fullscreen(!fs);
}
//---------------------------------------------------
function getFixedNumberOfIsovists()
{ 
  return gFixedNumberOfIsovists ; 
}
//---------------------------------------------------
function setFixedNumberOfIsovists( howMany )
{ 
  if( howMany < 1 ) howMany = 0 ; 
  gFixedNumberOfIsovists = Number(howMany); 
  console.log('Fixed number of isovists =', gFixedNumberOfIsovists ); 
}
//---------------------------------------------------
/**
 * 
 * @returns random FlatenPoint 
 */
function makeRandomPoint()
{ 
    const x1 = Math.random() * 800. ; 
    const y1 = Math.random() * 600.; 
    const p1 = new Point( x1, y1 ); 
    return p1 ; 
}
//---------------------------------------------------
/**
 *  Generates a list of random lines. 
 * @param {number} howMany 
 * @returns 
 */
/* 
function generateRandomLines( howMany = 100  )
{ 
  console.assert( howMany != undefined, 'No argument ' ); 
  const bx0 = 800 ;
  const z_zero = 600 ;  
  const DX = 100 ; 
  let listOfLines = [ 
    new Segment( new Point(bx0,z_zero),     new Point(bx0+DX,z_zero) ), 
    new Segment( new Point(bx0+DX,z_zero),   new Point(bx0+DX,z_zero+DX) ), 
    new Segment( new Point(bx0+DX,z_zero+DX), new Point(bx0,z_zero+DX)  ), 
    new Segment( new Point(bx0,z_zero+DX),  new Point(bx0,z_zero)  )
  ] ; 
  const D = 150.; 
  const D2 = D/2 ; 
  let a = 0 ; 
  for(  a = 0 ; a < howMany ; a++ )
  { 
    let p1 = makeRandomPoint() ; 
    const x2 = p1.x  + (( Math.random() * D ) -D2); 
    const y2 = p1.y +  (( Math.random() * D ) -D2 ); 
    
    let p2 = new Point(x2, y2 ); 

    let seg = new Segment( p1, p2 ); 
    listOfLines.push( seg ); 
  } 
  return listOfLines; 
}
*/ 
//---------------------------------------------------
function zoomInToMap() 
{ 
  zoomIn(mouseX, mouseY);
  updateOutput( "FYI: You can use the scroll wheel to zoom in");
}
//---------------------------------------------------
function zoomOutMap()
{ 
  zoomOut(mouseX, mouseY ); 
  updateOutput( "FYI: You can use the scroll wheel to zoom out");
}
//---------------------------------------------------
/**
 * do we want to do area select ? 
 * @returns 
 */
function mouseDragged() {
  if( isModalInputInProgress() )return ; 

  if( keyIsPressed == true && keyCode == SHIFT )
    { 
      lstMouseX = convertWindowToMapCoordX(mouseX ); 
      lstMouseY = convertWindowToMapCoordY( mouseY)  ; 

      
      return ; 
    }
    if( getCurrentTool() == kDRAG_AND_PAN )
    {
        fOffSetX += mouseX - pmouseX;
        fOffSetY += mouseY - pmouseY;
    }
}
//---------------------------------------------------
function mouseMoved(){ 
  if( getCurrentTool() == kISOVIST_DROPPER )
  { 
    lstMouseX = convertWindowToMapCoordX(mouseX ); 
    lstMouseY = convertWindowToMapCoordY( mouseY)  ; 
    makeIsovistFrom( lstMouseX , lstMouseY , gMaxIsovistRadius , -1  ); 
    /*let iso = makeIsovistFrom(lstMouseX , lstMouseY , gMaxIsovistRadius );
      iso = makeIsovistPolygonFromIsoRays( iso );
      gMouseIovist = iso ; 
      let ar = Math.abs(isovistArea( iso )); 
      updateOutput('Area = ' + ar.toFixed(2)); 
      */ 
  }
}
//---------------------------------------------------
//===================================================
/*
Zooming USER INTERFACE CODE 
*/ 
function mouseWheel(event) {
  let e = event.delta;
  
  if (e < 0) {
    zoomIn(mouseX, mouseY);
  } else {
    zoomOut(mouseX, mouseY);
  }
}

//---------------------------------------------------

function zoomIn(x, y) {
  let mapX = (x - fOffSetX) / fZoomFactor;
  let mapY = (y - fOffSetY) / fZoomFactor;

  let newscale = fZoomFactor * fIncrement;
  if (newscale >= fMaxZoom) {
    maxZoomReached();
    return;
  }
  
  let newOffX = ((mapX * fZoomFactor) + fOffSetX) - (mapX * newscale);
  let newOffY = ((mapY * fZoomFactor) + fOffSetY) - (mapY * newscale);
  
  fOffSetX = newOffX;
  fOffSetY = newOffY;
  fZoomFactor = newscale;
}

function zoomOut(x, y) {
  let mapX = (x - fOffSetX) / fZoomFactor;
  let mapY = (y - fOffSetY) / fZoomFactor;

  let newscale = fZoomFactor / fIncrement;
  if (newscale <= fMinZoom) {
    minZoomReached();
    return;
  }

  let newOffX = ((mapX * fZoomFactor) + fOffSetX) - (mapX * newscale);
  let newOffY = ((mapY * fZoomFactor) + fOffSetY) - (mapY * newscale);
  
  fOffSetX = newOffX;
  fOffSetY = newOffY;
  fZoomFactor = newscale;
}

function minZoomReached() {
  // Optional: Add sound or notification for min zoom
  //console.log("Minimum Zoom Reached");
  updateOutput("Minimum Zoom Reached" )
}

function maxZoomReached() {
  // Optional: Add sound or notification for max zoom
  updateOutput("Maximum Zoom Reached");
  
}

function convertWindowToMapCoordX(x) {
  return (x - fOffSetX) / fZoomFactor;
}

function convertWindowToMapCoordY(y) {
  return (y - fOffSetY) / fZoomFactor;
}

function convertMapCoordToWindowX(xmap) {
  return (xmap * fZoomFactor) + fOffSetX;
}

function convertMapCoordToWindowY(ymap) {
  return (ymap * fZoomFactor) + fOffSetY;
}
/**
 *  Part of Zoomming interface. Center the screen on the visible material
 */
function home()
{ 
  fZoomFactor = 1.0; 
  let bbox = getBoundingBoxForAllbuildingPolygons() ; 

  let midx = (bbox.x.max + bbox.x.min)/2; 
  let midy = (bbox.y.max + bbox.y.min)/2; 
  //fOffSetX(); 

  fOffSetX = (-midx) + ( width/2) ; 
  fOffSetY = (-midy) + ( height/2)  ; 

}
/*
  Given how little I'm using very tempted to redo everything in P5.Vector as the point
  then define my own ConvexPolygon and,   Triangle class, Bounds. 
  Also my own segment class - the use that for QuadTree. 
  then Isovist class ( coming soon ) 
*/ 

//============================================================================
function   test_Triangle_Intersection_VRD(randomise=false)
{ 
  //console.log( "HEY super duper triangle intersection here. ");
  
 /*  this IS problematic file due to triangle going counter clockise! NOW FIXED. 
 let triA =[{"x":69.88856961667656,"y":97.19452573278454},
             {"x":189.71795766522587,"y":63.99851459408835,},
             {"x":48.6502269092375,"y":92.14869326061452}]; 
  let triB = [{"x":105.13866593126708,"y":17.864107479663538},
              {"x":158.71703336933268,"y":113.20793541343454},
              {"x":98.976097822203,"y":101.17143237455862}];*/ 


let triA = [
  { x: 240, y: 70  },
  { x: 110, y: 170 },
  { x: 110, y: 70 }
];

let triB = [
      { x: 170,  y: 20  },
      { x: 170, y: 110 },
      { x: 50, y: 110  }
    ];

  if( randomise == true )
  { 
    const k = 120 ; 
    triA = [
      { x: 20 + Math.random()*k, y: 20+ Math.random()*k  },
      { x: 120 + Math.random()*k, y: 20 + Math.random()*k },
      { x: 20 + Math.random()*k, y: 90 + Math.random()*k }
    ];
    
    triB = [
      { x: 70 +Math.random()*k, y: 10+Math.random()*k  },
      { x: 130 + Math.random()*k, y: 100 + Math.random()*k },
      { x: 70+ Math.random()*k, y: 100   + Math.random()*k}
    ];
  } 
  gDebug_TriA = triA;
  gDebug_TriB = triB; 
  let in_py = intersectTriangle_VRD(triA, triB);
  gDebug_result = in_py; 
  if( randomise == false )
  { 
  let box = getBoundingBoxVRD( in_py); 
  //console.log(box.x.max-box.x.min);
  //console.log(box.y.max - box.y.min);
  let leng = 170-110; 
  let wid = 110-70;
  //console.log("coords=", in_py.length );
  //console.log("AREA = ",   polygonAreaVRD(in_py), leng*wid);
  console.assert( EQ(leng*wid , polygonAreaVRD(in_py) ), "Intersection or box or polygonAreaVRD wrong ")
  
  if( EQ(leng*wid , polygonAreaVRD(in_py)) ==false )
  { 
      console.log("test_Triangle_Intersection_VRD::FAILED");
      return ;
  } 
  } 

  //console.log("test_Triangle_Intersection_VRD:: TEST PASSED");
}
//----------------------------------------------------------------------------
 function isPointOnLineSegment( point , line) {
  // Destructure line and point objects
  const [start, end] = line;
  const { x: x1, y: y1 } = start;
  const { x: x2, y: y2 } = end;
  const { x: xp, y: yp } = point;

  // Step 1: Check if the point is collinear with the line
  const area = (xp - x1) * (y2 - y1) - (yp - y1) * (x2 - x1);
  
  // If the area is not 0, the point is not on the line
  if (area !== 0) {
    return false;
  }

  // Step 2: Check if the point is within the bounds of the line segment
  if (xp >= Math.min(x1, x2) && xp <= Math.max(x1, x2) &&
      yp >= Math.min(y1, y2) && yp <= Math.max(y1, y2)) {
    return true;
  }

  return false;
}
//----------------------------------------------------------------------------
/**
 *  checked against 
 *  https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
 * 
 * I am pretty well convinced this is working correctly. 
 * @param { } point 
 * @param {*} line 
 * @returns 
 */
function getSideOfLine(point , line ) 
{
  const c = point;

  const [a, b] = line;
  //const { x: x1, y: y1 } = start;
  //const { x: x2, y: y2 } = end;
  
  // Calculate the cross product
  //const crossProduct = ((xp - x1) * (y2 - y1)) - ((yp - y1) * (x2 - x1));
  const crossProduct = (b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)  
  point.debug_side = crossProduct;  // DEBUG 
  //console.log( " ⊙ = ",  crossProduct); 
  // need to do a ALMOST EQUAL check.
  if( EQ(crossProduct,0)==true )return 0 ; 

  if (crossProduct > 0) {
    return -1;  // Point is to the left of the line
  } else if (crossProduct < 0) {
    return 1; // Point is to the right of the line
  } else {
    console.assert(false, "Unreachable.");
    return 0;     // Point is on the line
  }
}
//----------------------------------------------------------------------------
/**
 * ASSUMES the TRIANGLE IS POSITIVE 
 * IF IS ON EDGE THEN IS INSIDE. 
 * @param {*} point 
 * @param {*} triangle 
 * @returns 
 */
function isPointOutSideTriangle(  point , triangle , debug=false )
{ 
  console.assert( point !=null , "No null points "); 
  console.assert( triangle != null , "NO null triangles" ); 
  console.assert( triangle.length > 2, "Must be triangles" ) ; 

  let segsA =  [ 
    [   triangle[0] ,  triangle[1]   ], 
    [   triangle[1] ,  triangle[2]  ],
    [   triangle[2] ,  triangle[0]  ] 
  ]; 
  let ar = polygonAreaVRD( triangle ); 
  if( ar < 0 )
  { 
    segsA =  [ 
      [   triangle[1] ,  triangle[0]   ], 
      [   triangle[2] ,  triangle[1]  ],
      [   triangle[0] ,  triangle[2]  ] 
    ]; 
  }
  for( let seg of segsA )
  { 
    let side = getSideOfLine( point , seg );
    if( debug == true ) 
    { 
      console.log( "x side = ", side , point.debug_side); 
    }
    if( side === 1 )return true  ; 
  }
  return false  ; 
}
//-----------------------------------------------------------------------------
/**
 * retrns true if the point is in the list. 
 * @param {*} point 
 * @param {*} list 
 * @returns 
 */
function pointExistsInList( point , allPoints )
{ 
  for( const p of allPoints )
  { 
    if( EQ( p.x , point.x ) && EQ(p.y, point.y ))
    { 
      return true; 
    }
  }
  return false; 
}
/*
  TODO check calcuations of area. 
  Check with other browser ( Chrome/Safari )
  HIDE DEBUG CODE 
  Intergrate with ISOVIST! 
*/ 
//----------------------------------------------------------------------------
/**
 * A triangle triangle intersection. Returns an array of points( VRD polyong). 
 * If the array is empty then no intersection. If not you can pass this to the 
 * array finding algorithum. 
 * 
 * Currently side effects on gDebug_intersectr_Pts and gDebug_cross_pts to 
 * let you see the result. 
 * 
 * @param {triangle in VRD format (array of {x,y} ordered )} triA 
 * @param {triangle in VRD format (array of {x,y} ordered )} triB 
 * @return  empty array if no intersection. List of coords in VRPolyFormat 
 */

function intersectTriangle_VRD( triA, triB )
{ 
  console.assert( triA != null , "No: null "); 
  console.assert(Array.isArray(triA) , "I am expecting an Array:1560" ) ; 
  console.assert( triA.length == 3 , "I only do triangles:1545") ; 

  console.assert( triB != null , "No: null "); 
  console.assert(Array.isArray(triB) , "I am expecting an Array:1564" ) ; 
  console.assert( triB.length == 3 , "I only do triangles:1548") ; 

  //roundCoordsVRD( triA ); roundCoordsVRD( triB );// not 100% sure if this is needed but hey.

  //-- FIRST  OVERLAP CHECK 
  let bboxFig1 =  getBoundingBoxVRD( triA); 
  let bboxFig2 =  getBoundingBoxVRD( triB ); 
  let overlap = boundingBoxesOverlapVRD(bboxFig1,bboxFig2 ); 
   
  let overlapcheck = doBoundingBoxesOverlap(bboxFig1,bboxFig2);
  console.assert( overlap == overlapcheck, "Overlap check failed:1577" ); 
  if( overlap == false  )
    { 
      //print("Not intersecting(bounds)");
      gDebug_intersectr_Pts = [] ;
      gDebug_cross_pts =[];  
      return [ ] ;
    } 

  let allPoints = [ // list of all points.
    triA[0] , triA[1] , triA[2] ,  
    triB[0] , triB[1] , triB[2] 
  ] ; 
 // print("INSIDE (false)", isPointOutSideTriangle( triA[0], triA ));

  //let outside =   { x: 0, y: 0 } ; 
 // print("outside (true)", isPointOutSideTriangle( outside, triA )); // should be true 

 // print("AREA ", polygonAreaVRD(triA) );

  let segsA =  [ 
    [   triA[0] ,  triA[1]   ], 
    [   triA[1] ,  triA[2]  ],
    [   triA[2] ,  triA[0]  ] 
  ]; 
  let segsB = [ 
    [   triB[0] ,  triB[1]   ], 
    [   triB[1] ,  triB[2]  ],
    [   triB[2] ,  triB[0]  ]  
  ];
// STAGE 1. find all points of intersection. 
  for( let a = 0 ; a < 3 ; a++)
  { 
    for( let b = 0 ; b < 3 ; b++)
    { // F.E.I returns a point + t values 
      let px = findEdgeIntersection(segsA[a], segsB[b]) ; 
      for(const p of px )
      {
        // NOT SURE IF THIS IS NESSASRY.
        if( !pointExistsInList( p,allPoints ))
        { 
        allPoints.push( p ); 
        }
      }
    }
  }
  gDebug_cross_pts = allPoints;
// STAGE 2. keep ones which are inside both triangles.
//ALSO  STAGE 3. compute centroid. 
  //console.log(" ALLPOINTS LEN = ", allPoints.length ); 
  let insd = [ ]; 
  let centroid = { x:0 , y:0}; 
  let count = 0 ; 
  for( const p of allPoints )
  {
    let outA = !isPointOutSideTriangle( p, triA); 
    let outB = !isPointOutSideTriangle( p, triB);
    p.debug_testA = outA ; 
    p.debug_testB = outB ; 
    if( outA==false && outB==false)
    { 
      console.error("Both false should never happen");
      let rs = isPointOutSideTriangle( triA[0], triA, true)
      console.error(  "result=",rs);
      console.log("hmm");
    }
    if( outA &&  outB )
    {
      insd.push( p); 
      centroid.x += p.x ; 
      centroid.y += p.y ;
      count +=1 ;  
    }
  }
  gDebug_intersectr_Pts = insd; 
  gSideMouseDebug.x = centroid.x; gSideMouseDebug.y = centroid.y
  if( count < 3  )
  { 
    //console.log( "Not intersecting POST "+ count);
    gDebug_intersectr_Pts = [] ; 
    return  [ ] ; // no intersection.   
  }
  centroid.x = centroid.x/count ; 
  centroid.y = centroid.y/count; 

  gSideMouseDebug.x = centroid.x; gSideMouseDebug.y = centroid.y; 
// 4. asign each the angle from the centroid. 
 for( let p of insd)
 { 
  // surely the other way around ? ... 
    p.angle = Math.atan2(p.y - centroid.y, p.x - centroid.x);
 }
 insd.sort( (a,b)=> { return a.angle-b.angle;} );
 // this is debug thing 
 for( let ix in insd){  insd[ ix ].index = ix ; }
 return insd; 
}
//----------------------------------------------------------------------------
function area_of_intersection_Triangles_VRD( triA, triB )
{ 
  let pts = intersectTriangle_VRD( triA, triB ); 
  if( pts == null || pts.length <= 2)
  { 
    return 0 ; // no area 
  }
  return polygonArea( pts); 
} 
//----------------------------------------------------------------------------
function roundCoordsVRD( fig1 )
{ 
  for (let i = 0; i < fig1.length; i++) {
    fig1[i].x = +((fig1[i].x).toFixed(9));//converts to string!
    fig1[i].y = +((fig1[i].y).toFixed(9));// and back! 
  }
}
/**
 * Finds the union of two PolygonsVRD. Returns an array/list of the polygons which 
 * you can then use as a meta polyong. 
 * 
 * Does not work with isovists. 
 * 
 * @param {VRD Polyong } fig1 
 * @param {VRD Polygons} fig2 
 * @returns and array of VRD Polygons 
 */

function UnionVRD(fig1, fig2) {
  console.error("WRONG VERSION OF UnionVRD BEING USED"); 
  for (let i = 0; i < fig1.length; i++) {
    fig1[i].x = +((fig1[i].x).toFixed(9));
    fig1[i].y = +((fig1[i].y).toFixed(9));
  }
  for (let i = 0; i < fig2.length; i++) {
    fig2[i].x = +((fig2[i].x).toFixed(9));
    fig2[i].y = +((fig2[i].y).toFixed(9));
  }
  var fig2a = alignPolygon(fig2, fig1);
  if (!checkPolygons(fig1, fig2a)) {
    return false;
  }
  var edges = edgify(fig1, fig2a);
  var polygons = polygonate(edges);
  var filteredPolygons = filterPolygons(polygons, fig1, fig2a, "sum");
  return filteredPolygons;
}
//-----------------------------------------------------------------------------
function alignPolygon(polygon, points) {
  for (let i = 0; i < polygon.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (distance(polygon[i], points[j]) < 0.00000001)
      polygon[i] = points[j];
    }    
  }
  return polygon;
}
//-----------------------------------------------------------------------------
function distance(p1, p2) {
  var dx = Math.abs(p1.x - p2.x);
  var dy = Math.abs(p1.y - p2.y);
  return Math.sqrt(dx*dx + dy*dy);
}
//-----------------------------------------------------------------------------
//check polygons for correctness
function checkPolygons(fig1, fig2) {
  var figs = [fig1, fig2];
  for (var i = 0; i < figs.length; i++) {
    if (figs[i].length < 3) {
      console.error("Polygon " + (i+1) + " is invalid!");
      return false; 
    } 
  }
  return true; 
}
//-----------------------------------------------------------------------------
//create array of edges of all polygons
function edgify(fig1, fig2) {
  //create primary array from all edges
  var primEdges = getEdges(fig1).concat(getEdges(fig2));
  var secEdges = [];  
  //check every edge
  for(var i = 0; i < primEdges.length; i++) {
    var points = [];
    //for intersection with every edge except itself
    for(var j = 0; j < primEdges.length; j++) {
      if (i != j) {
        var interPoints = findEdgeIntersection(primEdges[i], primEdges[j]);
        addNewPoints(interPoints, points);        
      }
    }
    //add start and end points to intersection points
    startPoint = primEdges[i][0];
    startPoint.t = 0;
    endPoint = primEdges[i][1];
    endPoint.t = 1;
    addNewPoints([startPoint, endPoint], points);
    //sort all points by position on edge
    points = sortPoints(points);
    //break edge to parts
    for (var k = 0; k < points.length - 1; k++) {
      var edge = [
        { x: points[k].x, y: points[k].y },
        { x: points[k+1].x, y: points[k+1].y}
      ];
      // check for existanse in sec.array
      if (!edgeExists(edge, secEdges)) {
        //push if not exists
        secEdges.push(edge);
      }          
    }    
  }  
  return secEdges;
}
//-----------------------------------------------------------------------------
function addNewPoints(newPoints, points) {
  if (newPoints.length > 0) {
    //check for uniqueness
    for (var k = 0; k < newPoints.length; k++) {      
      if (!pointExists(newPoints[k], points)) {        
        points.push(newPoints[k]);
      }
    }                   
  }   
}
//-----------------------------------------------------------------------------
function sortPoints(points) {
  var p = points;
  p.sort((a,b) => {
        if (a.t > b.t) return 1;
        if (a.t < b.t) return -1;
      });
  return p;
}
//-----------------------------------------------------------------------------
/**
 * Get Edges ( chain of [start,finish]  from polyong  )
 * V1 
 * @param {Polyong in VRD format } fig 
 * @returns 
 */
function getEdges(fig) {
  var edges = [];
  var len = fig.length;
  for (var i = 0; i < len; i++) {
    edges.push([
      {x: fig[(i % len)].x, y: fig[(i % len)].y},
      {x: fig[((i+1) % len)].x, y: fig[((i+1) % len)].y}
    ]);
  }
  return edges;
}
//-----------------------------------------------------------------------------
function findEdgeIntersection(edge1, edge2) {
  var x1 = edge1[0].x;
  var x2 = edge1[1].x;
  var x3 = edge2[0].x;
  var x4 = edge2[1].x;
  var y1 = edge1[0].y;
  var y2 = edge1[1].y;
  var y3 = edge2[0].y;
  var y4 = edge2[1].y;
  var nom1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  var nom2 = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
  var denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  var t1 = nom1 / denom;
  var t2 = nom2 / denom;
  var interPoints = [];
  //1. lines are parallel or edges don't intersect 
  if (((denom === 0) && (nom1 !== 0)) || (t1 <= 0) || (t1 >= 1) || (t2 < 0 ) || (t2 > 1)) {
    return interPoints;   
  }
  //2. lines are collinear 
  else if ((nom1 === 0) && (denom === 0)) {
    //check if endpoints of edge2 lies on edge1
    for (var i = 0; i < 2; i++) {
      var classify = classifyPoint(edge2[i], edge1);
      //find position of this endpoints relatively to edge1
      if (classify.loc == "ORIGIN" || classify.loc == "DESTINATION") {
        interPoints.push({x: edge2[i].x, y: edge2[i].y, t: classify.t});
      }
      else if (classify.loc == "BETWEEN") {
        x = +((x1 + classify.t*(x2 - x1)).toFixed(9));
        y = +((y1 + classify.t*(y2 - y1)).toFixed(9));
        interPoints.push({x: x, y: y, t: classify.t});
      }
    }    
    return interPoints; 
  }
  //3. edges intersect
  else {
    for (var i = 0; i < 2; i++) {
      var classify = classifyPoint(edge2[i], edge1);
      if (classify.loc == "ORIGIN" || classify.loc == "DESTINATION") {
        interPoints.push({x: edge2[i].x, y: edge2[i].y, t: classify.t});
      }
    }
    if (interPoints.length > 0) {
      return interPoints;  
    }
    var x = +((x1 + t1*(x2 - x1)).toFixed(9));
    var y = +((y1 + t1*(y2 - y1)).toFixed(9));
    interPoints.push({x: x, y: y, t: t1});
    return interPoints;
  }
}
//-----------------------------------------------------------------------------
/**
 * classifeds the poitn in relation to the edge( segment )
 * V1 
 * @param {*} p 
 * @param {*} edge 
 * @returns 
 */
function classifyPoint(p, edge) {
  var ax = edge[1].x - edge[0].x;
  var ay = edge[1].y - edge[0].y;
  var bx = p.x - edge[0].x;
  var by = p.y - edge[0].y;
  var sa = ax * by - bx * ay;
  if ((p.x === edge[0].x) && (p.y === edge[0].y)) {
    return {loc: "ORIGIN", t: 0};
  }
  if ((p.x === edge[1].x) && (p.y === edge[1].y)) {
    return {loc: "DESTINATION", t: 1};
  }
  var theta = (polarAngle([edge[1], edge[0]]) - 
    polarAngle([{x: edge[1].x, y: edge[1].y}, {x: p.x, y: p.y}])) % 360;
  if (theta < 0) {
    theta = theta + 360;
  } 
  if (sa < -0.000000001) {    
    return {loc: "LEFT", theta: theta};
  }
  if (sa > 0.000000001) {    
    return {loc: "RIGHT", theta: theta};
  }
  if (((ax * bx) < 0) || ((ay * by) < 0)) {
    return {loc: "BEHIND", theta: theta};
  }
  if ((Math.sqrt(ax * ax + ay * ay)) < (Math.sqrt(bx * bx + by * by))) {
    return {loc: "BEYOND", theta: theta};
  }
  var t;
  if (ax !== 0) {
    t = bx/ax;
  } else {
    t = by/ay;
  }
  return {loc: "BETWEEN", t: t};
}
//-----------------------------------------------------------------------------
/** 
 * gets the angle of the esge ( in degrees is looks like)
 * V! 
 * If you change this code update intersectionWorker
 * @param {*} edge 
 * @returns 
 */
function polarAngle(edge) {
  var dx = edge[1].x - edge[0].x;
  var dy = edge[1].y - edge[0].y;
  if ((dx === 0) && (dy === 0)) {
    //console.error("Edge has zero length.");
    return false;
  }
  if (dx === 0) {
    return ((dy > 0) ? 90 : 270);
  }
  if (dy === 0) {
    return ((dx > 0) ? 0 : 180);
  }
  var theta = Math.atan(dy/dx)*360/(2*Math.PI);
  if (dx > 0) {
    return ((dy >= 0) ? theta : theta + 360);
  } else {
    return (theta + 180);
  }
}
 //-----------------------------------------------------------------------------
function pointExists(p, points) {
  if (points.length === 0) {
    return false;
  }
  for (var i = 0; i < points.length; i++) {
    if ((p.x === points[i].x) && (p.y === points[i].y)) {
      return true;
    }
  }
  return false;
}
//-----------------------------------------------------------------------------
function edgeExists(e, edges) {
  if (edges.length === 0) {
    return false;
  }
  for (var i = 0; i < edges.length; i++) {
    if (equalEdges(e, edges[i]))
      return true;
  }
  return false;  
}
//-----------------------------------------------------------------------------
function equalEdges(edge1, edge2) {
  if (((edge1[0].x === edge2[0].x) &&
      (edge1[0].y === edge2[0].y) &&
      (edge1[1].x === edge2[1].x) &&
      (edge1[1].y === edge2[1].y)) || (
      (edge1[0].x === edge2[1].x) &&
      (edge1[0].y === edge2[1].y) &&
      (edge1[1].x === edge2[0].x) &&
      (edge1[1].y === edge2[0].y))) {
    return true;
  } else {
    return false;
  }
}
//-----------------------------------------------------------------------------
function polygonate(edges) {
  var polygons = [];
  var polygon = [];
  var len = edges.length;
  var midpoints = getMidpoints(edges);
  //start from every edge and create non-selfintersecting polygons
  for (var i = 0; i < len - 2; i++) {
    var org = {x: edges[i][0].x, y: edges[i][0].y};    
    var dest = {x: edges[i][1].x, y: edges[i][1].y};
    var currentEdge = i;
    var point;
    var p;
    var direction;
    var stop;
    //while we havn't come to the starting edge again
    for (direction = 0; direction < 2; direction++) {
      polygon = [];
      stop = false;
      while ((polygon.length === 0) || (!stop)) {
      //add point to polygon
        polygon.push({x: org.x, y: org.y});
        point = undefined;
        //look for edge connected with end of current edge
        for (var j = 0; j < len; j++) {
          p = undefined;
          //except itself
          if (!equalEdges(edges[j], edges[currentEdge])) {
            //if some edge is connected to current edge in one endpoint
            if ((edges[j][0].x === dest.x) && (edges[j][0].y === dest.y)) {
              p = edges[j][1];
            }
            if ((edges[j][1].x === dest.x) && (edges[j][1].y === dest.y)) {
              p = edges[j][0];
            }
            //compare it with last found connected edge for minimum angle between itself and current edge 
            if (p) {
              var classify = classifyPoint(p, [org, dest]);
              //if this edge has smaller theta then last found edge update data of next edge of polygon
              if (!point || 
                  ((classify.theta < point.theta) && (direction === 0)) ||
                  ((classify.theta > point.theta) && (direction === 1))) {
                point = {x: p.x, y: p.y, theta: classify.theta, edge: j};
              }
            }
          }
        }
        //change current edge to next edge
        org.x = dest.x;
        org.y = dest.y;
        dest.x = point.x;
        dest.y = point.y;
        currentEdge = point.edge;
        //if we reach start edge
        if (equalEdges([org, dest], edges[i])) {
          stop = true;
          //check polygon for correctness
          /*for (var k = 0; k < allPoints.length; k++) {
            //if some point is inside polygon it is incorrect
            if ((!pointExists(allPoints[k], polygon)) && (findPointInsidePolygon(allPoints[k], polygon))) {
              polygon = false;
            }
          }*/
          for (k = 0; k < midpoints.length; k++) {
            //if some midpoint is inside polygon (edge inside polygon) it is incorrect
            if (findPointInsidePolygon(midpoints[k], polygon)) {
              polygon = false;
            }
          }
        }   
      }
      //add created polygon if it is correct and was not found before
      if (polygon && !polygonExists(polygon, polygons)) {
        polygons.push(polygon);
      }
    }    
  }
  //console.log("polygonate: " + JSON.stringify(polygons));
  return polygons;
}
//-----------------------------------------------------------------------------
function polygonExists(polygon, polygons) {
  //if array is empty element doesn't exist in it
  if (polygons.length === 0) return false;
  //check every polygon in array
  for (var i = 0; i < polygons.length; i++) {
    //if lengths are not same go to next element
    if (polygon.length !== polygons[i].length) continue;
    //if length are same need to check
    else {
      //if all the points are same
      for (var j = 0; j < polygon.length; j++) {
        //if point is not found break forloop and go to next element
        if (!pointExists(polygon[j], polygons[i])) break;
        //if point found
        else {
          //and it is last point in polygon we found polygon in array!
          if (j === polygon.length - 1) return true;
        }        
      }
    }
  }
  return false;
}
//-----------------------------------------------------------------------------
function filterPolygons(polygons, fig1, fig2, mode) {
  var filtered = [];
  var c1, c2;
  var point;
  var bigPolygons = removeSmallPolygons(polygons, 0.0001);
  for(var i = 0; i < bigPolygons.length; i++) {
    point = getPointInsidePolygon(bigPolygons[i]);
    c1 = findPointInsidePolygon(point, fig1);
    c2 = findPointInsidePolygon(point, fig2);
    if (
        ((mode === "intersect") && c1 && c2) || //intersection
        ((mode === "cut1") && c1 && !c2) ||     //fig1 - fig2
        ((mode === "cut2") && !c1 && c2) ||     //fig2 - fig1
        ((mode === "sum") && (c1 || c2))) {     //fig1 + fig2      
      filtered.push(bigPolygons[i]);
    }
  }
  //console.log("filtered: " + JSON.stringify(filtered));
  return filtered;
}
//-----------------------------------------------------------------------------
function removeSmallPolygons(polygons, minSize) {
  var big = [];
  for (var i = 0; i < polygons.length; i++) {
    if (polygonArea(polygons[i]) >= minSize) {
      big.push(polygons[i]);
    }
  }
  return big;
}
//-----------------------------------------------------------------------------
function polygonArea(p) {
  var len = p.length;
  var s = 0;
  for (var i = 0; i < len; i++) {
     s += (p[i % len].x * p[(i + 1) % len].y) - (p[i % len].y * 
      p[(i + 1) % len].x);
  }
  return Math.abs(s/2);
}
//-----------------------------------------------------------------------------
function getPointInsidePolygon(polygon) {
  var point;
  var size = getSize(polygon);
  var edges = getEdges(polygon);
  var y = size.y.min + (size.y.max - size.y.min) / Math.PI;
  var dy = (size.y.max - size.y.min) / 13;
  var line = [];
  var points;
  var interPoints = [];
  var pointsOK = false;
  while (!pointsOK) {
    line = [{x: (size.x.min - 1), y: y},{x: (size.x.max + 1), y: y}];
    //find intersections with all polygon edges
    for (var i = 0; i < edges.length; i++) {
      points = findEdgeIntersection(line, edges[i]);
      //if edge doesn't lie inside line
      if (points && (points.length === 1)) {
         interPoints.push(points[0]);      
      }
    }
    interPoints = sortPoints(interPoints);
    //find two correct interpoints
    for (var i = 0; i < interPoints.length - 1; i++) {
      if (interPoints[i].t !== interPoints[i+1].t) {
        //enable exit from loop and calculate point coordinates
        pointsOK = true;
        point = {x: ((interPoints[i].x + interPoints[i+1].x) / 2), y: y};
      }
    }
    //all points are incorrect, need to change line parameters
    y = y + dy;
    if (((y > size.y.max) || (y < size.y.min)) && (pointsOK === false)) {
      pointsOK = true;
      point = undefined;
    }
  }
  return point;
}
//-----------------------------------------------------------------------------
/**
 *  Effectivly returns the bounding box of the polyon as an array
 * @param { array of x,y points } polygon 
 * @returns 
 */
function getSize(polygon) {
  var size = {
    x: {
      min: polygon[0].x,
      max: polygon[0].x
    },
    y: {
      min: polygon[0].y,
      max: polygon[0].y
    }
  };
  for (var i = 1; i < polygon.length; i++) {
    if (polygon[i].x < size.x.min) size.x.min = polygon[i].x;
    if (polygon[i].x > size.x.max) size.x.max = polygon[i].x;
    if (polygon[i].y < size.y.min) size.y.min = polygon[i].y;
    if (polygon[i].y > size.y.max) size.y.max = polygon[i].y;
  }
  return size;
}
//-----------------------------------------------------------------------------
/**
 * does a point on ( in? ) polygon test!!! 
 * V1 
 * @param {*} point 
 * @param {*} polygon 
 * @returns 
 */
function findPointInsidePolygon(point, polygon) {
  var cross = 0;
  var edges = getEdges(polygon);
  var classify;
  var org, dest;
  for (var i = 0; i < edges.length; i++) {
    [org, dest] = edges[i];
    classify = classifyPoint(point, [org, dest]);
    if (  (
            (classify.loc === "RIGHT") &&
            (org.y < point.y) &&
            (dest.y >= point.y)
          ) ||
          (
            (classify.loc === "LEFT") &&
            (org.y >= point.y) &&
            (dest.y < point.y)
          )
        ) {
      cross++;    
    }
    if (classify.loc === "BETWEEN") return false;
  }
  if (cross % 2) {
    return true;
  } else {
    return false;
  }
}
//-----------------------------------------------------------------------------
function getMidpoints(edges) {
  var midpoints = [];
  var x, y;
  for (var i = 0; i < edges.length; i++) {
    x = (edges[i][0].x + edges[i][1].x) / 2;
    y = (edges[i][0].y + edges[i][1].y) / 2;
    classify = classifyPoint({x: x, y:y}, edges[i]);
    if (classify.loc != "BETWEEN") {
      console.error("Midpoint calculation error");
    }
    midpoints.push({x: x, y: y}); 
  }
  return midpoints;
}
  
function log(obj) {
  console.log(JSON.stringify(obj));
}
//-----------------------------------------------------------------------------
/**
 * returns true if polyon.
 * @param {point in VRD format } point 
 * @param {Array in VRD format } polygon 
 */
function pointInVRDPolygon( point, polygon )
{ 
  console.assert( isValidVRDPolygon( polygon ), "not a polyon 4900 ");
  return  findPointInsidePolygon( point, polygon ); 
}
//-----------------------------------------------------------------------------
/**
 * returns the area of the polygon - can be negative if the polygon is counter clockwise.
 *
 * @param {Polygon in VRD format( list of x/y coods )} poly 
 * @returns area in square 'pixels' 
 */
function polygonAreaVRD( poly )
{ 
  console.assert( isValidVRDPolygon( poly ), "not a polyon 4911 ");
  let p = poly ; 
  let len = poly.length;
  let s = 0;
  for (let i = 0; i < len; i++) {
      s += (p[i % len].x * p[(i + 1) % len].y) - (p[i % len].y * 
      p[(i + 1) % len].x);
  }
  return s/2;
}
//-----------------------------------------------------------------------------
/* function convertVRDPolygonToIsovist( polygon  )
{ 
  console.assert( polygon != null , " No null arguments"); 
  console.assert( Array.isArray(  polygon) , " Not a polygon"); 
  console.assert(polygon.length >= 3 , "Polygon not big enough. "); 

  let total = { x:0, y:0 };
  for( const pt of polygon) 
  { 
    total.x += pt.x ; 
    total.y += pt.y ; 
  }
  total.x = total.x  / polygon.length ; 
  total.y = total.y / polygon.length ; 
  const center = total ; 
  console.log( "Center ", center.x , center.y ); 
  let result = [ ]; 
  for( const pt of polygon) 
  { 
    let segment = {  ps: center , pe:pt  }; 
    result.push( segment );
  }
  return  result; 
}*/ 
function convertVRDPolygonToIsovistFromCenter( polygon  , center  )
{ 
  console.assert( polygon != null , " No null arguments"); 
  console.assert( Array.isArray(  polygon) , " Not a polygon"); 
  console.assert(polygon.length > 3 , "Polygon not big enough. "); 
  console.assert( center != null , " Null center," );

  let result = [ ]; 
  for( const pt of polygon) 
  { 
    let segment = {  ps: center , pe:pt  }; 
    result.push( segment );
  }
  return  result; 
}

//-----------------------------------------------------------------------------
/**
 * get the bounding box. 
 * @param {Polygon in VRD format  list of x/y coods } polygon 
 * @returns bounding box 
 */
function getBoundingBoxVRD( polygon )
{ 
  console.assert( polygon !=null , "No Null arguments to getBoundingBoxVRD please"); 
  var size = {
    x: {
      min: polygon[0].x,
      max: polygon[0].x
    },
    y: {
      min: polygon[0].y,
      max: polygon[0].y
    }
  };
  for (var i = 1; i < polygon.length; i++) {
    if (polygon[i].x < size.x.min) size.x.min = polygon[i].x;
    if (polygon[i].x > size.x.max) size.x.max = polygon[i].x;
    if (polygon[i].y < size.y.min) size.y.min = polygon[i].y;
    if (polygon[i].y > size.y.max) size.y.max = polygon[i].y;
  }
  return size;
}
//-----------------------------------------------------------------------------
/**
 *  returns true/false to see if there is any area in commont between them. 
 *  Format of VRD bouding box 
 *  Notice we don't reject cases where they are touching.
    let box = {
    x: {
      min: polygon[0].x,
      max: polygon[0].x
    },
    y: {
      min: polygon[0].y,
      max: polygon[0].y
    }
  };

 * @param {bounding box in VRD format} box1 
 * @param {bounding box in VRD format } box2 
 * @returns boolean : true if there is overlap. 
 */
//-----------------------------------------------------------------------------
function boundingBoxesOverlapVRD( box1 , box2)
{ 
  console.assert(box1 != null , "No null arguments:boundingBoxesOverlapVRD:2162"); 
  console.assert(box2 != null , "No null arguments:boundingBoxesOverlapVRD:2163");

  if( box2.x.max  < box1.x.min) return false ; 
  if( box2.x.min > box1.x.max ) return false ; 

  if( box2.y.max <  box1.y.min )return false ; 
  if( box2.y.min > box1.y.max )return false ; 

  return true ; 
}
//-----------------------------------------------------------------------------
/**
 * This checkst to see if two boxes in VRD format overlap or not. 
 * This is is a check against the othter ( slightly faster method). 
 * They both check each other at the moment. 
 * 
 * @param {bounding box in VRD format  } box1 
 * @param {*} box2 
 * @returns boolean if bbox intersect/overlap or not. Not sure about touching. 
 */
function doBoundingBoxesOverlap(box1, box2) {
  // Check if one box is to the left or right of the other
  const isNotLeft = box1.x.max >= box2.x.min;
  const isNotRight = box1.x.min <= box2.x.max;

  // Check if one box is above or below the other
  const isNotAbove = box1.y.max >= box2.y.min;
  const isNotBelow = box1.y.min <= box2.y.max;

  // If both x and y ranges overlap, the boxes overlap
  return isNotLeft && isNotRight && isNotAbove && isNotBelow;
}
//-----------------------------------------------------------------------------
/**
 * returns true if innter polygon is completely inside outer polygon. 
 * @param {polygon in VRD format} polyOuterVRD 
 * @param {polygon in VRD format} polyInnerVRD 
 */
function polygonVRDWholeContainedByPolygonVRD( polyOuterVRD, polyInnerVRD )
{ 
  console.assert(  polyOuterVRD != null , "No null arguments" ); 
  console.assert(  polyInnerVRD != null , "No null arguments" ); 

  // break at first sign - quicker than getting bounding box. 
  for (var i = 1; i < polyInnerVRD.length; i++) {
    let inside = findPointInsidePolygon( polyInnerVRD[i], polyOuterVRD ); 
    if( inside == false )
    { 
      return false ; 
    }
  }
  return true ; 
}
//-----------------------------------------------------------------------------
/**
 * 
 * @param {bounding box in VRD format} bbox1 
 * @param {bounding box in VRD format} bbox2 
 * @returns 
 */
function unionOfBoundingBoxsVRD( bbox1, bbox2 )
{ 
  var unionbox = {
    x: {
      min: min( bbox1.x.min,bbox2.x.min ),
      max: max( bbox1.x.max,bbox2.x.max ) 
    },
    y: {
      min: min( bbox1.y.min, bbox2.y.min),
      max: max( bbox1.y.max , bbox2.y.max)
    }
  };
  
  return unionbox;
}
function isValidVRDPolygon( polyToCheck )
{ 
  if( polyToCheck === undefined )return false ; 
  if( polyToCheck == null )return false ; 
  if( Array.isArray( polyToCheck ) == false )return false ; 
  if( polyToCheck.length == 0 )return false ; 
  let it = polyToCheck[ 0 ]; 
  if( it.x === undefined )return false ; 
  if( Number.isFinite( it.x ) == false ) return false ; 
  if( it.y === undefined ) return false ; 
  if( Number.isFinite(it.y ) == false ) return false ; 
  return true ; 
}
//-----------------------------------------------------------------------------
/**
13 * Set new floating point comparison tolerance
14 * @param {number} tolerance
15 */

/**
function setTolerance(tolerance) {DP_TOL = tolerance;}

19 * Get floating point comparison tolerance
20 * @returns {number}
21 */
function getTolerance() {return DP_TOL;}

const DECIMALS = 3;

/**
27 * Returns *true* if value comparable to zero
28 * @param {number} x
29 * @param {number} y
30 * @return {boolean}
31 */
function EQ_0(x) {
    return (x < DP_TOL && x > -DP_TOL);
}
 
/**
37 * Returns *true* if two values are equal up to DP_TOL
38 * @param {number} x
39 * @param {number} y
40 * @return {boolean}
41 */
function EQ(x, y) {
    return (x - y < DP_TOL && x - y > -DP_TOL);
}

/**
47 * Returns *true* if first argument greater than second argument up to DP_TOL
48 * @param {number} x
49 * @param {number} y
50 * @return {boolean}
51 */
function GT(x, y) {
    return (x - y > DP_TOL);
}

/**
57 * Returns *true* if first argument greater than or equal to second argument up to DP_TOL
58 * @param {number} x
59 * @param {number} y
60 * @returns {boolean}
61 */
function GE(x, y) {
    return (x - y > -DP_TOL);
}
//-----------------------------------------------------------------------------

/**
* Returns *true* if first argument less than or equal to second argument up to DP_TOL
* @param {number} x
* @param {number} y
* @return {boolean}
*/
function LE(x, y) {
  return (x - y < DP_TOL);
}
/**
 * Externally visiable dianostics item hide shows QuaddTree 
 */
function showQuadTree()
{ 
  gShowQuadTree = !gShowQuadTree;  
}

//-----------------------------------------------------------------------------
/**
 *  checks to see if a point is 
 * @param {Polygon} boundingPolygon 
 * @param {Array of building polygons} listOfBuildings 
 * @param {2D point } trialPoint 
 * @returns boolean 
 */
function isValidPoint( boundingPolygon, listOfBuildings , trialPoint )
  { 
    console.assert( trialPoint != null); 
    console.assert( listOfBuildings !=null ); 
 

    if( pointInVRDPolygon( trialPoint , boundingPolygon ) == false) return false ; 
    let inOpenSpace = false  ; 
    for( const b of listOfBuildings)
    {
      inOpenSpace = pointInVRDPolygon(trialPoint,  b );
      if( inOpenSpace == true ) return false ; 
    }
    return true ;
  }
  //-----------------------------------------------------------------------------
  function validRandomPointOrNil( boundingPolygon, listOfBuildings, bbox  )
  { 
    function getRandomBetween(a, b) {
      return Math.random() * (b - a) + a;
    }


    let trialPoint = { x:0 , y:0}; 
      
    let tries = 10000 ; // try a thousand times to be on the safe side.
   
    do // try against all the buildings 
    { 
      do // try lots of points in the bounding box
      { 
        trialPoint.x  = getRandomBetween( bbox.x.min, bbox.x.max  );
        trialPoint.y  = getRandomBetween( bbox.y.min, bbox.y.max  );
        if( --tries < 0 )  // tries times out. 
        { 
          doAlert(" could not make a point in this bounding box"); 
          return null ; 
        }
      } while( pointInVRDPolygon( trialPoint , boundingPolygon ) == false ) ; 

    } while( isValidPoint(  boundingPolygon, listOfBuildings, trialPoint) == false) ; 
    return trialPoint

  }

 
//-----------------------------------------------------------------------------
/**
 * MACHINE GENERATE VERSION with only 1 mistake ! 
 * I changed the algorith to avoid growth because for small sample sizes 
 * it did produce a valid zone. 
 * 
 * @param {} radius 
 * @param {*} numberOfPointsToGenerate 
 * @param {*} boundingPoly 
 * @param {*} listOfPolygons 
 * @param {*} bbox 
 * @returns 
 */

function bridsonAlgorithm(radius, numberOfPointsToGenerate, boundingPoly, listOfPolygons, bbox) {
  const sampleSpace = [];
  const activeList = [];
  const cellSize = radius / Math.sqrt(2);
  const k = 30; // Number of attempts to find a neighbor
  
  // Use provided bbox for the grid
  const xmin = bbox.x.min;
  const ymin = bbox.y.min;
  const xmax = bbox.x.max;
  const ymax = bbox.y.max;
  
  const gridWidth = Math.ceil((xmax - xmin) / cellSize);
  const gridHeight = Math.ceil((ymax - ymin) / cellSize);
  const grid = Array(gridWidth * gridHeight).fill(null);
  
  // Helper function to get grid index
  const getGridIndex = (point) => {
      const col = Math.floor((point.x - xmin) / cellSize);
      const row = Math.floor((point.y - ymin) / cellSize);
      return row * gridWidth + col;
  };
  
  // Helper function to check if a point is too close to existing points
  const isTooClose = (point) => {
      const col = Math.floor((point.x - xmin) / cellSize);
      const row = Math.floor((point.y - ymin) / cellSize);
      
      // Check neighboring cells (including diagonals)
      for (let i = Math.max(0, row - 2); i <= Math.min(gridHeight - 1, row + 2); i++) {
          for (let j = Math.max(0, col - 2); j <= Math.min(gridWidth - 1, col + 2); j++) {
              const idx = i * gridWidth + j;
              if (grid[idx] !== null) {
                  const existingPoint = sampleSpace[grid[idx]];
                  const dx = existingPoint.x - point.x;
                  const dy = existingPoint.y - point.y;
                  const distSq = dx * dx + dy * dy;
                  if (distSq < radius * radius) {
                      return true;
                  }
              }
          }
      }
      return false;
  };
  
  // Generate initial point
  const initialPoint = validRandomPointOrNil(boundingPoly, listOfPolygons,bbox );
  if (!initialPoint) {
      return sampleSpace; // No valid starting point found
  }
  
  sampleSpace.push(initialPoint);
  activeList.push(0);
  grid[getGridIndex(initialPoint)] = 0;
  
  // Main algorithm loop
  while (activeList.length > 0 && sampleSpace.length < numberOfPointsToGenerate) {
      // Pick a random point from active list
      const randomIndex = Math.floor(Math.random() * activeList.length);
      const pointIndex = activeList[randomIndex];
      const point = sampleSpace[pointIndex];
      
      let foundCandidate = false;
      
      // Try k attempts to find a valid neighbor
      for (let attempt = 0; attempt < k; attempt++) {
          // Generate random point in annulus between radius and 2*radius
          //const angle = Math.random() * 2 * Math.PI;
          //const distance = radius + Math.random() * radius;
          
          const trialPoint = validRandomPointOrNil( boundingPoly, listOfPolygons, bbox ); 
          if( trialPoint == null ) return ; // bounding poly error. 
          //old bad way  { x: point.x + distance * Math.cos(angle), y: point.y + distance * Math.sin(angle) };
          
          // Check if point is valid (in bounds and not in buildings)
          if (!isValidPoint( boundingPoly, listOfPolygons, trialPoint)) {
              continue;
          }
          
          // Check if point is not too close to existing points
          if (!isTooClose(trialPoint)) {
              // Add the new point
              const newIndex = sampleSpace.length;
              sampleSpace.push(trialPoint);
              activeList.push(newIndex);
              grid[getGridIndex(trialPoint)] = newIndex;
              foundCandidate = true;
              
              if (sampleSpace.length >= numberOfPointsToGenerate) {
                  break;
              }
          }
      }
      
      // If no candidate found after k attempts, remove point from active list
      if (!foundCandidate) {
          activeList.splice(randomIndex, 1);
      }
  }
  
  return sampleSpace;
}
//-----------------------------------------------
/**
 * Sets up a blud noise random grid.
 * Needs to be sensative to the grid VGA would generate. 
 */
function randomBlueNoiseGrid() 
{ 
  console.log( " Random grid generate"); 
  console.log("Generate_Isovist using blue noise.");
  if( gFixedNumberOfIsovists <= 0 )gFixedNumberOfIsovists = 1024 + 512 ; 
  console.log('Number of isovists to generate = ' + gFixedNumberOfIsovists);

  alert('Generate Blue noise grid Density = ' + getCurrentGridDensity() + " number of points =" + gFixedNumberOfIsovists  ); 

  const boundingPolygon = gBoundingBoxPoly; 
  const listOfBuildings = gBuilding_polygons ; 
  const bbox = getBoundingBoxVRD( boundingPolygon ); 

  console.assert( boundingPolygon!=null ,'Nonnull arg');
  console.assert( isValidVRDPolygon(boundingPolygon), 'boundingPolygon not polygon'); 
  console.assert( listOfBuildings != null , "Null buildings "); 
  console.assert( Array.isArray( listOfBuildings ), "building_polygons  null");
  
  let raidus = getCurrentGridDensity() ; 
  let  numberOfPointsToGenerate = gFixedNumberOfIsovists ; 
  // aliases 
 
  let sampleSpace =  bridsonAlgorithm(raidus, numberOfPointsToGenerate, boundingPolygon, listOfBuildings, bbox); 
  gAllIsovists = [] 
  for( const p of sampleSpace  )
  {
    let iso = new Isovist( p.x ,p.y , null  ); 
    gAllIsovists.push(iso);
  }

  console.log("blue grid done. size = ", gAllIsovists.length );
}
//-----------------------------------------------
/**
 *  this function uses  noise to generate a random grid. 
 * 
 */
/* function randomGrid_OLD_VERSION( )
{ 
  console.log( " Random grid generate"); 
  console.log("Generate_Isovist using blue noise.");
  console.log('Number of isovists to generate = ' + gFixedNumberOfIsovists);
  // aliases 
  const boundingPolygon = gBoundingBoxPoly; 
  const listOfBuildings = gBuilding_polygons ; 
  const bbox = getBoundingBoxVRD( boundingPolygon ); 
  const xmin = bbox.x.min ; 
  const ymin = bbox.y.min ; 
  const xmax = bbox.x.max ; 
  const ymax = bbox.y.max ; 
  console.assert( gBoundingBoxPoly!=null ,'Nonnull arg');
  console.assert( isValidVRDPolygon(boundingPolygon), 'Arg 1 not polygon'); 
  console.assert( listOfBuildings != null , "Null buildings "); 
  console.assert( Array.isArray( listOfBuildings ), "building_polygons  null");
  
  //gAllIsovists = []  ; // remove all the old isovists 
  let box = getBoundingBoxVRD( gBoundingBoxPoly );


  for( let  a = 0 ; a < 1000 ; a++ )
  { 
    const trialPoint = validRandomPointOrNil( gBoundingBoxPoly, listOfBuildings); 
    console.log("GOOD. point is in open space " + trialPoint );
    let iso = new Isovist( trialPoint.x ,trialPoint.y , null  ); 
    gAllIsovists.push(iso);
  } // end for 



  console.log("blue grid done.");
}
*/ 
/**
 *  
 * So start with item an random origin and destination 
 */


function doDirectedAreaOverlapChoice() 
{
  console.log(" Do Choice ");
  if( gAllIsovists == null || gAllIsovists.length < 3 || gAllIsovists[0].hasIsovist == false  )
    { 
      startModalInputInProgress(); 
        doAlert("You need to generate isovists first ( try command/control R)"); 
      endModalInputInProgress(); 
      return ; 
    }
    // set all values to zero. 
    for( let iso of gAllIsovists )
    {
        iso.resetAsymetricAreaOverlapChoice( ) ;  
        iso.choice = 0.0 ; 
    }
    gSelectedIsovists.clear(); 
    gSelectedIsovists.add( gAllIsovists[0] ); // push first 
    findStepDepthFromSelection() ; 
    // start at the far end and work back 
    
    looks like the problem is that the do choice method 
    shuodl be run AFTER the values are returned. 
    
    
    gAllIsovists[ gAllIsovists.length-2 ].doChoice(1.0,gAllIsovists[0].ID , gAllIsovists );
    
    for( let iso of gAllIsovists )
    {
      iso.currentValue = iso.choice ;   
    }

    gAllIsovists[ gAllIsovists.length-2 ].selected = true ;// MARK
    
    //pict point.
    //go back to source 
    // where to short routes split. 
    colorByCurrentValue( );
    
}




//-----------------------------------------------------------------------------

function testVRD()
{ 
  let  box1 = {
    x: {
      min: 1,
      max: 7
    },
    y: {
      min: 1,
      max: 5
    }
  };

  let boxOverlaps = { 
    x: {
      min: 4,
      max: 10
    },
    y: {
      min: 3,
      max: 8
    }
  };
  let box2 = boxOverlaps; 

  let boxNotOverLaps = { 
    x: {
      min: 1,
      max: 3
    },
    y: {
      min: 7,
      max: 9
    }
  }
  console.log("## TEST VRD ###"); 

  let ovlp = boundingBoxesOverlapVRD(box1,boxOverlaps ); 
  console.assert(ovlp == true , "Overlap Test fails 1"  ); 
  ovlp = doBoundingBoxesOverlap(box1,boxOverlaps );
  console.assert(ovlp == true , "Overlap Test fails 2 " ); 

  ovlp = boundingBoxesOverlapVRD(box1,boxNotOverLaps ); 
  console.assert(ovlp == false  , "Overlap Test fails  3"  ); 
  ovlp = doBoundingBoxesOverlap(box1,boxNotOverLaps );
  console.assert(ovlp == false  , "Overlap Test fails 4" );  

  ovlp = boundingBoxesOverlapVRD(box2,boxNotOverLaps ); 
  console.assert(ovlp == false  , "Overlap Test fails  5"  ); 
  ovlp = doBoundingBoxesOverlap(box2,boxNotOverLaps );
  console.assert(ovlp == false  , "Overlap Test fails 6" );  

  ovlp = boundingBoxesOverlapVRD(boxOverlaps, box1 );
  console.assert(ovlp == true , "Overlap Test fails 5"  ); 
  ovlp = doBoundingBoxesOverlap(boxOverlaps,  box1 );
  console.assert(ovlp == true , "Overlap Test fails 6" ); 

  //@@@ TODO add in test for  unionOfBoundingBoxsVRD
  console.log("## TEST PASSED ###"); 
}
//-----------------------------------------------------------------------------
function testIntersection_Worker() 
{ 

   const [x,y]  = findLineSegmentIntersection(
          7,5 ,13, 16,  // Line 1 
        11,4, 4, 11) ; // line 2 - 

  const lin1  = makeALine( 7,5 ,13, 16 ); 
  let intsec = intersectsLine( lin1, 11,4, 4, 11 ); 
  //print("Insc", intsec);
   //print(" ###" , x, " y", y ); 
}
//-----------------------------------------------------------------------------
/**
 * converted from JavaCode - this finds point of intersection between two lines. 
 * 
 * @param {number} x0 
 * @param {number} y0 
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number} x3 
 * @param {number} y3 
 * @returns 
 */
function findLineSegmentIntersection(x0, y0, x1, y1, x2, y2, x3, y3) {
  // Constants
  const LIMIT = 1e-5;
  const INFINITY = 1e10;

  let x, y;

  // Helper function to check if two values are approximately equal
  function geomEquals(a, b, limit) {
    return Math.abs(a - b) < limit;
  }

  // Helper function to find the minimum of multiple values
  function geomMin(...args) {
    return Math.min(...args);
  }

  // Helper function to find the maximum of multiple values
  function geomMax(...args) {
    return Math.max(...args);
  }

  // Convert the lines to the form y = ax + b
  let a0 = geomEquals(x0, x1, LIMIT) ? INFINITY : (y0 - y1) / (x0 - x1);
  let a1 = geomEquals(x2, x3, LIMIT) ? INFINITY : (y2 - y3) / (x2 - x3);

  let b0 = y0 - a0 * x0;
  let b1 = y2 - a1 * x2;

  // Check if lines are parallel
  if (geomEquals(a0, a1, LIMIT)) {
    if (!geomEquals(b0, b1, LIMIT)) {
      return null; // Parallel non-overlapping
    } else {
      if (geomEquals(x0, x1, LIMIT)) {
        if (Math.min(y0, y1) < Math.max(y2, y3) || Math.max(y0, y1) > Math.min(y2, y3)) {
          let twoMiddle = y0 + y1 + y2 + y3 -
                          geomMin(y0, y1, y2, y3) -
                          geomMax(y0, y1, y2, y3);
          y = twoMiddle / 2.0;
          x = (y - b0) / a0;
        } else {
          return null; // Parallel non-overlapping
        }
      } else {
        if (Math.min(x0, x1) < Math.max(x2, x3) || Math.max(x0, x1) > Math.min(x2, x3)) {
          let twoMiddle = x0 + x1 + x2 + x3 -
                          geomMin(x0, x1, x2, x3) -
                          geomMax(x0, x1, x2, x3);
          x = twoMiddle / 2.0;
          y = a0 * x + b0;
        } else {
          return null; // Parallel non-overlapping
        }
      }

      return [ x, y ]; // Return the intersection point
    }
  }

  // Find correct intersection point
  if (geomEquals(a0, INFINITY, LIMIT)) {
    x = x0;
    y = a1 * x + b1;
  } else if (geomEquals(a1, INFINITY, LIMIT)) {
    x = x2;
    y = a0 * x + b0;
  } else {
    x = -(b0 - b1) / (a0 - a1);
    y = a0 * x + b0;
  }

  return [ x, y ]; // Return the intersection point
}




 
  function sideOf(ABx, ABy, ACx, ACy) {
    return (ABx * ACy) - (ABy * ACx);
  }

  // Method to check if two lines intersect
  function intersectsLine( other , otherHozStart, otherVertStart, otherHozEnd, otherVertEnd)
  {
    // Calculate differences between points

    let ABh, ABv, ACv, ACh, abadSide, abacSide; // variables as double
    let ADv, ADh, CDh, CDv;
    
    let left_side, right_side;

    ABv = other.fVertEnd - other.fVertStart;
    ABh = other.fHozEnd - other.fHozStart;

    ADv = otherVertStart - other.fVertStart;
    ADh = otherHozStart - other.fHozStart;

    abadSide =  sideOf(ABv, ABh, ADv, ADh);

    ACv = otherVertEnd - other.fVertStart;
    ACh = otherHozEnd - other.fHozStart;

    CDh = otherHozEnd - otherHozStart;
    CDv = otherVertEnd - otherVertStart;
    abacSide = sideOf(ABv, ABh, ACv, ACh);

    // Check if lines cross
    if ((abacSide * abadSide) <= 0) {
      left_side = sideOf(CDh, CDv, other.fHozEnd - otherHozStart, other.fVertEnd - otherVertStart);
      right_side = sideOf(CDh, CDv, other.fHozStart - otherHozStart, other.fVertStart - otherVertStart);

      if ((left_side * right_side) <= 0.0) {
        return true; // Lines intersect
      }
    }

    return false; // No intersection
  }


