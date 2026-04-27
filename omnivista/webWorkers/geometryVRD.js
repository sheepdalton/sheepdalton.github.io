'use strict';
//                      debug triangle intersection.
let gDebug_intersectr_Pts = [ ] ; 
let gDebug_cross_pts = [] ; 
let gDebugIntersection = null ; 
let gInterSectZones = [] ; 
      // Debug segment  see testIntersection, see process isovists 
let gSeg1 = null ;
let gSeg2 = null ;
let gSegB1 = null ; 
let gSegB2 = null ; 

let gSideMouseDebug = [  { x:100, y:10 }];

const kDEBUGGING = true ; 
export function isThisworking()
{ 
    console.log("This is a message from inside isWorking"); 
}
// I AM NOT SURE THIS WORKS 
export function isValidNumber(value) {
    return value !== undefined && value !== null && typeof value === 'number' && !isNaN(value);
  }
export function isNumberAndNotNull(value) {
    return typeof value === 'number' && value !== null;
  }

export function isValidVRD_Point( point ) 
{ 
    if( point === undefined ) return false ; 
    if( point == null )return false ; 
    if( point.x == undefined )return false ; 
    if( point.y == undefined )return false ; 
    return true ; 
}
//-----------------------------------------------------------------------------
/*export function isVRDPolygon( poly )
{ 
  if( polygon ==null) return false ; 
  if( Array.isArray( polygon )==false ) return false ; 
  if(  polygon.length <= 0 ) return false ; 
  if( polygon[ 0].x === undefined )return false ; 
  if( ! Number.isFinite( polygon[ 0].x) ) return false ; 
  return true ; 
}*/
//-----------------------------------------------------------------------------
/**
 * get the bounding box. 
 * @param {Polygon in VRD format  list of x/y coods } polygon 
 * @returns bounding box 
 */
export function getBoundingBoxVRD( polygon )
{ 
  console.assert( polygon !=null , "No Null arguments to getBoundingBoxVRD please"); 
  console.assert( Array.isArray( polygon ), "Argument is not a polygon 1"); 
  console.assert(  polygon.length > 0 , "Cannot process emty polygons"); 
  console.assert(  polygon[ 0].x !== undefined , "is polygon in VRD format?"); 
  console.assert( Number.isFinite( polygon[ 0].x) ,"is polygon in VRD format?2");
  
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
 *  returns isPoint_Outside_VRDBoundingBox
 * @param {not null point inVRD format } pointVRD 
 * @param {not null bounding in VRD format } bboxVRD 
 * @returns true if point outside or false if could be inside on edge 
 */
export function isPoint_Outside_VRDBoundingBox( pointVRD, bboxVRD )
{
  console.assert( pointVRD !=null ,'arg 1 not a point');
  console.assert( isValidVRD_Point( pointVRD ), 'arg 1 not VRD point(k88)');
  console.assert(  bboxVRD!= null,'Arg2 not a bounding box '); 

  if( pointVRD.x > bboxVRD.x.max) return true ; 
  if( pointVRD.x < bboxVRD.x.min) return true ; 
  if( pointVRD.y > bboxVRD.y.max) return true ; 
  if( pointVRD.y < bboxVRD.y.min) return true ; 
  return false ; 
}
//-----------------------------------------------------------------------------
/**
 *  returns thes the point(s) of intersection of two edges.
 * 
 * @param {*} edge1 
 * @param {*} edge2 
 * @returns 
 */
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
//----------------------------------------------------------------------------
/**
 * ASSUMES the TRIANGLE IS POSITIVE 
 * IF IS ON EDGE THEN IS INSIDE. 
 * 
 * This is consuming 60% of computational time. Possibly the GC
 * @param {*} point 
 * @param {*} triangle 
 * @returns 
 */
let gSegsA =   [ 
  [  0 , 0  ], 
  [  0, 0 ],
  [  0 , 0  ] 
]; 
function isPointOutSideTriangle(  point , triangle , debug=false )
{ 
  console.assert( point !=null , "No null points "); 
  console.assert( triangle != null , "NO null triangles" ); 
  console.assert( triangle.length > 2, "Must be triangles" ) ; 
  
  let ar = polygonAreaVRD( triangle ); 
  let segsA = null ; 
  if( ar < 0 )
  { 
    segsA =  [ 
      [   triangle[1] ,  triangle[0]   ], 
      [   triangle[2] ,  triangle[1]  ],
      [   triangle[0] ,  triangle[2]  ] 
    ]; 
  }else
  {
    segsA =  [ 
      [   triangle[0] ,  triangle[1]   ], 
      [   triangle[1] ,  triangle[2]  ],
      [   triangle[2] ,  triangle[0]  ] 
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
function isPointOutSideTriangle_CORRECT(  point , triangle , debug=false )
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
//----------------------------------------------------------------------------
/**
 * A triangle triangle intersection. Returns an array of points( VRD polyong). 
 * If the array is empty then no intersection. If not you can pass this to the 
 * array finding algorithum. 
 * 
 * Currently side effects on gDebug_intersectr_Pts and gDebug_cross_pts to 
 * let you see the result. 
 * 
 * THIS IS SLOWING PROGRAM DOWN - Perhaps there is a faster point OUTSIDE trigngle test? 
 * 
 * @param {triangle in VRD format (array of {x,y} ordered )} triA 
 * @param {triangle in VRD format (array of {x,y} ordered )} triB 
 * @return  empty array if no intersection. List of coords in VRPolyFormat 
 */
export function intersectTriangle_VRD( triA, triB )
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
   
  //let overlapcheck = doBoundingBoxesOverlap(bboxFig1,bboxFig2);
  console.assert( overlap == doBoundingBoxesOverlap(bboxFig1,bboxFig2), "Overlap check failed:1577" ); 
  if( overlap == false  )
    { 
      //console.log(("Not intersecting(bounds)");
      gDebug_intersectr_Pts = [] ;
      gDebug_cross_pts =[];  
      return [ ] ;
    } 

  let allPoints = [ // list of all points.
    triA[0] , triA[1] , triA[2] ,  
    triB[0] , triB[1] , triB[2] 
  ] ; 
 // console.log(("INSIDE (false)", isPointOutSideTriangle( triA[0], triA ));

  //let outside =   { x: 0, y: 0 } ; 
 // console.log(("outside (true)", isPointOutSideTriangle( outside, triA )); // should be true 

 // console.log(("AREA ", polygonAreaVRD(triA) );

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
//--------------------------------------------------------------------
/**
 * takes the isovists and the index within. Creates 2 triangles. 
 * then does the simpler insection of both triangles. 
 * returns the area of overlap plus the polygon
 * @see computeIntersectionOfIsovists 
 * 
 * @param {number} indexA 
 * @param {number} indexB 
 * @param {Boolean} accumulate 
 * @returns area of overlap of triangle ( 0.0 if they don't intersect )
 * updates 
 * 
 * gSeg1, gSeg2 ( debuggging )
 * gInterSectZones , gDebugIntersection 
 */
export function processIsovists( indexA ,indexB ,isoVistA, isoVistB,  accumulate = false  )
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
     //console.log(("@@@ isoVistIntersection:: no intersect@@@@@"); 
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
//--------------------------------------------------------------------
/**
 * 
 * GEnerally we know the isovists must overlap : the calling code only tests those
 * who have an isoivst center in side this isovist center. 
 * 
 * @@@ TODO compute bounding boxs of A and B, 
 *           Compute intersection of bounding boxes. C 
 *           For trigangle An 
 *              if An's bounding box overlaps C bounding box then intersect. 
 *              otherwise - ignore. 
 *      Need someway to measure speed.     
 * 
 * @see processAreaOverlap - of areaOver.js 
 * 
 * @param {isovistInVRD format } isoVA 
 * @param {isovistInVRD format } isoVB 
 * @returns { overlap: true/false, intersectionArea:  , areaA: , areaB: union: faction } 
 */
export function computeIntersectionOfIsovists( isoVA,isoVB )
{
  //console.log("computeIntersectionOfIsovists::"); 
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
  let fraction = total_intersection_Area/ unionArea; 
  if( false )
  {
  console.log(" overlap area = ", total_intersection_Area.toFixed(5));
  console.log(" A = ", areaA.toFixed(5) ); 
  console.log(" B = ", bArea.toFixed(5) ); 
  console.log(" I = ", total_intersection_Area.toFixed(5) ); 
  console.log(" F= ",fraction.toFixed(2) );
  } 
  return [  total_intersection_Area , areaA, bArea , unionArea]; 
}
//-----------------------------------------------------------------------------
export function debugGetInerSectionZones() 
{ 
  return gInterSectZones ; 
}
//-----------------------------------------------------------------------------
/** 
  THIS IS DAGEROUS @see  convertVRDPolygonToIsovistFromCenter
  @deprecated
*/ 
function convertVRDPolygonToIsovist( polygon  )
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
}
//-----------------------------------------------------------------------------
export function convertVRDPolygonToIsovistFromCenter( polygon  , center  )
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
//----------------------------------------------------------------------------
function makePointVRD( hoz, vert )
{ 
  return {x: hoz??0, y: vert??0} ;
}
//-----------------------------------------------------------------------------

/**
 *    remember the polyong must have an end which matches the beginning to 
 * make sure the final triangle is computed. 
 * 
 */
export function testIntersection() 
{ 
  console.log( "TESTING intersection (Geometry libary)"); 
  let fig1 = [
    { x: 3, y: 2  },
    { x: 8, y: 2  },
    { x: 8, y: 6  }, 
    { x: 3, y: 6  },
    { x: 3, y: 2  }
  ];
  
  let fig2 = [
    { x: 5, y: 4  },
    { x: 12, y: 4  },
    { x: 12, y: 9  },
    { x: 5, y: 9  },
    { x: 5, y: 4  },
  ];

  let iso1 = convertVRDPolygonToIsovist( fig1 ); 
  let iso2 = convertVRDPolygonToIsovist( fig2 ); 

  computeIntersectionOfIsovists(iso1, iso2 );

  let fig3 = [
    { x: 5, y: 10  },
    { x: 15, y: 10  },
    { x: 15, y: 2  } ,
    { x: 5, y: 10  }
  ];
  
  let fig4 = [
    { x: 10, y: 7  },
    { x: 21, y: 7  },
    { x: 10, y: 15  }, 
    { x: 10, y: 7  } 
  ];

  iso1 = convertVRDPolygonToIsovist( fig3 ); 
  iso2 = convertVRDPolygonToIsovist( fig4); 

  computeIntersectionOfIsovists(iso1, iso2 );
} 

//-----------------------------------------------------------------------------
export function isovistArea( radial_segments )
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

//-----------------------------------------------------------------------------
/**
 * returns the area of the polygon - can be negative if the polygon is counter clockwise.
 *
 * @param {Polygon in VRD format( list of x/y coods )} poly 
 * @returns area in square 'pixels' 
 */
export function polygonAreaVRD( poly )
{ 
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
function sideOf(ABx, ABy, ACx, ACy) {
  return (ABx * ACy) - (ABy * ACx);
}

export function doLinesIntersectFast( 
  this_fHozStart , this_fVertStart,  this_fHozEnd   , this_fVertEnd  ,
  otherHozStart   , otherVertStart , otherHozEnd    , otherVertEnd    )
{ 
 //let ABh, ABv, ACv, ACh, abadSide, abacSide; // variables as double
 //let ADv, ADh, CDh, CDv;
 
 let left_side, right_side;

 let ABv = this_fVertEnd - this_fVertStart;
 let ABh = this_fHozEnd - this_fHozStart;

 let ADv = otherVertStart - this_fVertStart;
 let ADh = otherHozStart - this_fHozStart;

 let abadSide = sideOf(ABv, ABh, ADv, ADh);

 let ACv = otherVertEnd - this_fVertStart;
 let ACh = otherHozEnd - this_fHozStart;

 let CDh = otherHozEnd - otherHozStart;
 let CDv = otherVertEnd - otherVertStart;
 let abacSide = sideOf(ABv, ABh, ACv, ACh);

 // Check if lines cross
 if ((abacSide * abadSide) <= 0) {
   left_side = sideOf(CDh, CDv, this_fHozEnd - otherHozStart, this_fVertEnd - otherVertStart);
   right_side = sideOf(CDh, CDv, this_fHozStart - otherHozStart, this_fVertStart - otherVertStart);

   if ((left_side * right_side) <= 0.0) {
     return true; // Lines intersect
   }
 }
 return false; // No intersection
}
//-----------------------------------------------------------------------------
/**
 * returns point of intersection - between two lines ( 0,1) and ( 2,3)
 * if test with @see  doLinesIntersectFast first
 * @param {*} x0 
 * @param {*} y0 
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 * @param {*} x3 
 * @param {*} y3 

 * @returns [x, y] or null if no intersection - test with @see  doLinesIntersectFast first 
 
 */
function findIntersection(x0, y0, x1, y1, x2, y2, x3, y3) {
  // Calculate the coefficients of the lines
  const denom = (x0 - x1) * (y2 - y3) - (y0 - y1) * (x2 - x3);
  
  // If the determinant (denom) is 0, the lines are parallel (or coincident), so no intersection
  if (Math.abs(denom) < 1e-10) {
    return null;  // Lines are parallel or coincident
  }

  // Calculate the intersection point using the determinant method
  const x = ((x0 * y1 - y0 * x1) * (x2 - x3) - (x0 - x1) * (x2 * y3 - y2 * x3)) / denom;
  const y = ((x0 * y1 - y0 * x1) * (y2 - y3) - (y0 - y1) * (x2 * y3 - y2 * x3)) / denom;

  // Return the intersection point as an array [x, y]
  return [x, y];
}

//-----------------------------------------------------------------------------
/**
 * 
 * @param {*} segment 
 * @param {*} fig 
 * 
 * @returns [ polgon , index ]
 */
function trimSegmentByPolygon(  segment, fig )
{ 
  let intersectoinReport = null ; 
  let len = fig.length;
  for (var i = 0; i < len; i++) {
    const hit =   doLinesIntersectFast(segment.ps.x , segment.ps.y , segment.pe.x , segment.pe.y,
                           fig[(i % len)].x, fig[(i % len)].y ,
                            fig[((i+1) % len)].x, fig[((i+1) % len)].y );
    if( hit == true )
    { 
        let insc = findIntersection( segment.ps.x , segment.ps.y , segment.pe.x , segment.pe.y,
          fig[(i % len)].x, fig[(i % len)].y ,
           fig[((i+1) % len)].x, fig[((i+1) % len)].y);
        if(  insc != null )
        { 
          segment.pe.x = insc[ 0 ]; 
          segment.pe.y = insc[ 1 ];
          intersectoinReport = { poly: fig , index : i }; 
          //let derefObj = weakRef.deref();

        } 
    }
  }
  return intersectoinReport ; 
}

//----------------------------------------------------------------------------
/**
 * if the lines intersect with polyon then the end is trimed to it. 
 *  if last argument is true will trim off
 * Version 2 
 * @param {segement (line) in VRD format } segment 
 * @param {polygon in VRD format } fig in VRD format  
 */
export function trimIsovistByPolygons( isovist , polygon_array, remove_unnessary_segments=true )
{ 
  let segList = { } ; 
  for( let segIndex  in  isovist )
  { 
    for( const poly of polygon_array)
    { 
      const  zud = does_SegmentIntersectPolygon(  isovist[ segIndex ], poly ); 
        if( zud )
        { 
          let r = trimSegmentByPolygon(isovist[ segIndex ],poly ); 
          if( r != null )
          { 
            segList[ segIndex ]= r ; 
          }
        }
    }
  }

  if( remove_unnessary_segments ==true )
    { 
        let  listOfIsovistRays = isovist  ; 
        let lastSeg = null ; 
        let removeList = [ ] ; 

        for( let idx = 1 ; idx < listOfIsovistRays.length-2; idx++ )
        { // check to see if 
          const  idx_before= idx - 1; 
          const  idx_after = idx + 1 ; 
          if( (idx_before in segList) &&  
              ( idx in  segList ) && 
              (idx_after in  segList)  )
              {
                  let segBefore = segList[  idx_before ]; 
                  let curSeg    = segList[ idx ]; 
                  let getAfter  = segList[ idx_after ]; 
                  // if they are in the same polyonh 
                  if( segBefore.poly ==  curSeg.poly  && 
                      segBefore.index ==  curSeg.index && 
                      
                      getAfter.poly ==  curSeg.poly && 
                      getAfter.index ==  curSeg.index  ) 
                    { 
                      if( curSeg != null ) removeList.push(listOfIsovistRays[ idx ] ); 
                    }   
              } 
        }
        listOfIsovistRays = listOfIsovistRays.filter(item => !removeList.includes(item));
        return listOfIsovistRays;  
      } 
  
      return isovist;
}
//-----------------------------------------------------------------------------
/* 
   perhaps we should do a bounding box check first ? 
   Cache the bounding box in a dicionary - created on upload. 

   Or use quad tree?
   
*/ 
function  does_SegmentIntersectPolygon( segment, fig)
{
  let len = fig.length;
  for (var i = 0; i < len; i++) {
    const hit =   doLinesIntersectFast(segment.ps.x , segment.ps.y , segment.pe.x , segment.pe.y,
                           fig[(i % len)].x, fig[(i % len)].y ,
                            fig[((i+1) % len)].x, fig[((i+1) % len)].y );
    if( hit == true )
    { 
      return true ; 
    }
  }
  return false ;
}

//-----------------------------------------------------------------------------
/**
 *  makes a VRD isovist ( array of segments in VRD format )
 *  Version 2 - 
 * @param {number} hoz 
 * @param {number} vert 
 * @param {number } radius 
 * @returns 
 */
export function makeIsovistFrom( hoz, vert  , radius = 88, degrees_per_segent = 2 )
{ 
  let isovistRays = [] ; 
  const span = (Math.PI/ 180.0 ) * degrees_per_segent ;  // want spans of 2 degrees.
  let center = { x:hoz, y: vert } ;  
  let index = 0 ; 
  const AFULL_CIRCLE = ( (Math.PI* 2.)+0.00000001);
  let ry = {  ps: center ,   pe: { x:0, y: 0 } } ;
  for( let angle = 0 ; angle < AFULL_CIRCLE ; angle += span )
  { 
    const h = hoz + ( radius * Math.sin( angle )); 
    const v = vert + ( radius * Math.cos( angle)); 
    let  end = { x:h, y: v}; 
    ry = {  ps: center ,   pe: end  }  ;
    //const copyOfRy = Object.assign({}, ry);
    isovistRays.push( ry  ); 
    //console.log(( index,  angle , h,v);
    index+= 1 ; 
  }
  console.assert(isovistRays[ isovistRays.length-1]  != null  );
  if(false)console.log( "@@ MAKE ISIOVST" ,isovistRays[ 0 ], " l = ", 
    isovistRays.length ,  isovistRays[ isovistRays.length-1], 
    distance(isovistRays[ 0 ].pe, isovistRays[ isovistRays.length-1].pe) ); 
 
  return isovistRays ; 
}
//----------------------------------------------------------------------------
/**
 *  checked against 
 *  https://stackoverflow.com/questions/1560492/how-to-tell-whether-a-point-is-to-the-right-or-left-side-of-a-line
 * 
 * I am pretty well convinced this is working correctly. 
 * @param { pointin VRD format } point 
 * @param {line in VRD segment format } line 
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
  const crossProduct = (b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)  ; 
 /* if( kDEBUGGING )
  { 
    point.debug_side = crossProduct;  // DEBUG 
  } */
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
//-----------------------------------------------------------------------------
/// doesn't feel linek one of min 
export function distanceVRD(p1, p2) {
  var dx = Math.abs(p1.x - p2.x);
  var dy = Math.abs(p1.y - p2.y);
  return Math.sqrt(dx*dx + dy*dy);
}

//-----------------------------------------------------------------------------
/**
 * Get Edges ( chain of [start,finish]  from polyong  )
 * V1 
 * @param {Polyong in VRD format } fig 
 * @returns 
 */
export function getEdges(fig) {
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
/** 
 * gets the angle of the esge ( in degrees is looks like)
 * V! 
 * If you change this code update intersectionWorker
 * @param {*} edge 
 * @returns 
 */
export function polarAngle(edge) {
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
  /**
 * classifeds the poitn in relation to the edge( segment )
 * V1 
 * @param {*} p 
 * @param {*} edge 
 * @returns 
 */
export function classifyPoint(p, edge) {
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
 * does a point on ( in? ) polygon test!!! 
 * V1 
 * @param {point in VRDformat} point 
 * @param {polygon in VRD format (array of VRD points)} polygon 
 * @returns 
 */
export function findPointInsidePolygon(point, polygon) {
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
/**
 *  
 * V1 
 * @param {point in VRD format } point 
 * @param {polygon in VRD format (array of VRD points )} polygon 
 * @returns 
 */
export  function pointInVRDPolygon( point, polygon )
{ 
    console.assert( isValidVRD_Point(point ), "Not a valid VRD point: 159" + JSON.stringify(point)); 
    console.assert( Array.isArray( polygon ), "Arg 2 not a polyong "+ JSON.stringify( polygon) );
    return  findPointInsidePolygon( point, polygon ); 
}
//-----------------------------------------------------------------------------
function testFastNearstPointFinder()
{ 
    let randompoints = [ ] ; 
    for( let a = 0 ; a < 100 ; a++ )
    { 
        let ipoind = { x:getRandomBetween( 0, 400  ) , y:getRandomBetween( 0, 50  )}; 
        randompoints.push( ipoind ); 
    }
    randompoints.sort((a, b) => a.x - b.x);// sort by X 
    gValidIsovistPoints = randompoints;
    console.log( "5=",   binarySearchClosestByX(randompoints[5].x, randompoints ));
   console.assert(  binarySearchClosestByX(randompoints[0].x, randompoints ) ==0 , "ERROR" ); 
   console.assert(  binarySearchClosestByX(randompoints[5].x, randompoints ) ==5 ,  "ERROR 2" );
   
   console.assert(  
     findDistSquardToClosestPointTo( randompoints[5], randompoints)==0 , "findDistSquardToClosestPointTo problems");

    for( let u= 0 ; u < 100 ; u++)
    {
        let tpoint = { x:getRandomBetween( 0, 400  ) , y:getRandomBetween( 0, 50  )};
        let d_slow =  findDistSquardToClosestPointTo( tpoint, randompoints); 
        let d_fast =  findDistSquardToClosestPointTo_fast(tpoint , randompoints); 
        if(  d_slow != d_fast)
        { 
            console.error("Differance " , d_slow == d_fast,d_slow,d_fast ); 
        }
    }
    console.log("findDistSquardToClosestPointTo_fast Test passed"); 
}
/*
p5.prototype.isThisworking = function(){
    console.log('I will load a CSV file soon!');
  };
*/ 

//-----------------------------------------------------------------------------
/**
 *  Does a O(log(N) ) find 
 * @param {number} targetXValue 
 * @param {array of VRD points} arr 
 * @returns index of closest item to one requested. 
 */
export function binarySearchClosestByX( targetXValue , arr) {
    console.assert( isNumberAndNotNull(targetXValue ), "First arg is null");
    console.assert( Array.isArray (arr )==true, "First arg is null");
    if(arr.length > 2  )
    { 
        console.assert( arr[0].x < arr[1].x, "NOT SORTED , binarySearchClosestByX" );
        console.assert( arr[0].x < arr[arr.length-1 ].x, "NOT SORTED , binarySearchClosestByX" );
    }
    // Step 1: Sort the array (if it's not already sorted)
    // arr.sort((a, b) => a - b);
 
  
    let left = 0;
    let right = arr.length - 1;
    let closestIndex = -1;
    let closestDiff = Infinity;  // Initialize with a large number
    //console.log((" binary search ", left ," ",  right , targetXValue ); 
  
    // Step 2: Binary search for the closest value
    while (left <= right) {
       
      const mid = Math.floor((left + right) / 2);
      const diff = Math.abs(arr[mid].x - targetXValue);
    

      // If the current difference is smaller than the closest difference, update
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = mid;
        //  console.log(( "closest vaue" ,closestIndex,closestDiff  ); 
        if( closestDiff == 0 )
            return closestIndex; 
      }
  
      // Adjust the search range
      if (arr[mid].x < targetXValue) {

        left = mid + 1;
      } else {
        right = mid - 1;
      }

    }
  
    // Step 3: Return the index of the closest value
    return closestIndex;
  }

//-----------------------------------------------------------------------------
 /**
     * return   the Distance Squard To  Closest Point To a  CORRECT BUT FAST 
     * @param {point in VRD format } point 
     * @param {array of points in VRD format } arrayOfPoints_sorted 
     * @returns 
     */
export function findDistSquardToClosestPointTo_fast( point , arrayOfPoints_sorted)
{ 
    console.assert( isValidVRD_Point( point ), "argument point is not vald VRD point"); 
    console.assert(  Array.isArray(arrayOfPoints_sorted) , "Argument not valid array: 237") ; 
    

    if(  arrayOfPoints_sorted.length == 0 ) return Number.MAX_VALUE; 

    let closestIndex = binarySearchClosestByX( point.x , arrayOfPoints_sorted ); 
    let closes_point = arrayOfPoints_sorted[closestIndex ]; 

    const r =   Math.sqrt( ( (point.x - closes_point.x)**2 )+ (( point.y-closes_point.y )**2) ); 
    let bottomIndex = binarySearchClosestByX( point.x - r , arrayOfPoints_sorted );
    let upperIndex =  arrayOfPoints_sorted.length -1 ; 
    // same for top index.
    if( closestIndex < (arrayOfPoints_sorted.length-2)) 
    { 
        upperIndex = closestIndex+1; 
        let upperPoint =  arrayOfPoints_sorted[upperIndex ] ; 
        const rupper =   Math.sqrt( ( (point.x - upperPoint.x)**2 )+ (( point.y-upperPoint.y )**2) ); 
        upperIndex = binarySearchClosestByX( point.x + rupper , arrayOfPoints_sorted );
    }
    //console.log(("Search range = ", bottomIndex ,"To", upperIndex); 
 
    let minDist = Number.MAX_VALUE; 
    let minPoint = null ; 
  

    for( let ix =  bottomIndex ; ix <=upperIndex ; ix++ )
    { 
      const p = arrayOfPoints_sorted[ ix ]; 
      console.assert( isValidVRD_Point( p ), "argument point is not vald VRD point"); 
      const dis =   ((point.x - p.x)**2 )+ (( point.y-p.y )**2) ; 
      if( dis < minDist)
      { 
        minPoint = p ; 
        minDist = dis ; 
        /// not for workwr version gMinPoint = p ; 
      }
    }
    return minDist;
} 
//-----------------------------------------------------------------------------
    /**
     * return   the Distance Squard To  Closest Point To a  CORRECT BUT SLOW
     * @param {point in VRD format } point 
     * @param {array of points in VRD format } arrayOfPoints_sorted 
     * @returns 
     */
export    function findDistSquardToClosestPointTo( point , arrayOfPoints_sorted)
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
    }// end for.

    console.assert( minPoint!=null , "should not happed :225");
    return minDist; 
}


 
//-----------------------------------------------------------------------------
/**
 * Imperfectly works out the start and end points.  
 * @param {number} rangeStart 
 * @param {number} rangeEnd 
 * @param {int} workersCount 
 * @param {int} worker - must be  0  <  worker < workersCount
 * @returns [ chunkStart , chunkEnd ]
 */
export function workoutRange(  rangeStart, rangeEnd, workersCount , worker )
{ 
  console.assert( isNumberAndNotNull( rangeStart)  , "needed number"); 
  console.assert( isNumberAndNotNull( rangeEnd )  , "needed number"); 
  console.assert( isNumberAndNotNull( workersCount )  , "needed number"); 
  console.assert( isNumberAndNotNull( worker )  , "needed number"); 

  const rangeLength = rangeEnd - rangeStart;
  const chunkSize = Math.floor(rangeLength / workersCount);
  const chunkStart = rangeStart + (worker * chunkSize); 
  const chunkEnd = worker === workersCount - 1 ? rangeEnd : chunkStart + chunkSize;
  //console.log( worker , "@", chunkStart, " ", chunkEnd ); 
  return [ chunkStart , chunkEnd ] ; 
}
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
13 * Set new floating point comparison tolerance
14 * @param {number} tolerance
15 */
const  DP_TOL = 0.000001; 

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

76/**
77 * Returns *true* if first argument less than or equal to second argument up to DP_TOL
78 * @param {number} x
79 * @param {number} y
80 * @return {boolean}
81 */
 function LE(x, y) {
    return (x - y < DP_TOL);
}

