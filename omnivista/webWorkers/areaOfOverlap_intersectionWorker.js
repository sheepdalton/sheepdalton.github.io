'use strict';


// 
/* 
      This should compute the area of overlap connetions.  
*/ 
/*
    This woker computs the intergration from the starting 
    node to all other nodes. 

    returns data
*/ 
import { 
  isNumberAndNotNull , 
  isValidNumber, 
  isValidVRD_Point , 
  pointInVRDPolygon, 
  getBoundingBoxVRD, 
  findDistSquardToClosestPointTo_fast, 
  testIntersection
    } from './geometryVRD.js' ; 

/*
      let  messageFrame = 
    { 
        messageID :  1 , 
        messageCheck : 0xBADFACE , 
        thisIsovist : gProcessedIsovist , 
        center      : { x: mouseX, y: mouseY}  , 
        isovistID   : -1  , 
        isoivsits_centers_to_check: px  
    }; 
    let  messageFormat = 
   { 
       messageID :  1 , 
       messageCheck : 0xBADFACE , 
       thisIsovist : polygonInVRD-Format , 
       center      : point in VRD format , 
       isovistID   : some indenifyer , 
       isoivsits_centers_to_check; [  { x:, y:, isovistID }]
   }
    given the list of isovists to check - return the list 
    which are inside the boundaies. 

    this does the check for old fashioned intersection. 
    returns 
    { 
         isovists : [ { x: , y: isoivstID  }]
    }

 
    let  messageFrame = 
    { 
        messageID :  1 , 
        messageCheck : 0xBADFACE , 
        thisIsovist : gProcessedIsovist , 
        center      : { x: mouseX, y: mouseY}  , 
        isovistID   : -1  , 
        isoivsits_centers_to_check: px  
    }; 

    worker returns a list of points which are in the isovists boundayy. 
    if not returned then the isovists are not mutually vissible. 
    returns 
    { 
         isovists : [ { x: , y: isoivstID , areaOfOverlap: , faction :  union: }]
    }

    // does intersection of 2 isovists 
  let  messageFormat = 
   { 
       messageID :  2 , 
       messageCheck : 0xBADFACE , 
       isoivsA ; 
          { 
            thisIsovist : polygonInVRD-Format , 
            center      : point in VRD format , 
            isovistID   : some indenifyer 
          } 
       isovistB: 
          {
            thisIsovist : polygonInVRD-Format , 
            center      : point in VRD format , 
            isovistID   : some indenifyer , 
          }
   }


   // this is the self diagnostic to run internal checks 
   let  messageFormat = 
   { 
    
       messageID :  4,  
       messageCheck : 0xBADFACE , 
  } 
       { returns True/False if checks pass. }


*/

onmessage = (e) => {
    console.log("Message received from main script");
    //console.log(  messageFromWorker = e.data ) ; 
    //xconsole.log( typeof(  e.data ));
    const message = e.data ; 
    console.assert( message !== undefined  ," Message unde:90"); 
    console.assert( message !=null ,  "message null:91"); 
    console.assert( message.messageCheck != undefined , "check failed 102" ); 
    console.assert( message.messageCheck = 0xBADFACE  , "MESSAGE IN WRONG FORMAT, 103"); 
    console.assert( Number.isInteger ( message.messageID  ),"NO MESSAGEID 104" ); 
    switch(message.messageID )
    { 
      case 1 : 
      { 
        processOriginalIntersection( message );
        
        return ; 
      }break ; 

      default: 
      { 
          //console.log(Array.isArray(e.data)); 
            //let inputVec = e.data; 
            //console.log( "Item 0 " , inputVec[ 0 ] ); 
            // console.log( "Item 1 " , inputVec[ 1 ] ); 
            //const workerResult = "Result:"  + inputVec.join("::") ;
            const workerResult = "Intersection worker comment not understood." + message.messageID; 
            console.log(workerResult);
            postMessage(workerResult);
      }
    }

 
  };
/*
  let  messageFrame = 
  { 
      messageID :  1 , 
      messageCheck : 0xBADFACE , 
      thisIsovist : gProcessedIsovist , 
      center      : { x: mouseX, y: mouseY}  , 
      isovistID   : -1  , 
      isoivsits_centers_to_check: px  
  }; 
  let  messageFormat = 
 { 
     messageID :  1 , 
     messageCheck : 0xBADFACE , 
     thisIsovist : polygonInVRD-Format , 
     center      : point in VRD format , 
     isovistID   : some indenifyer , 
     isoivsits_centers_to_check; [  { x:, y:, isovistID }]
 }
  given the list of isovists to check - return the list 
  which are inside the boundaies. 

  returns 
  let response = { 
    messageID: message.messageID , 
    messageCheck:  message.messageCheck, 
    org_center:  message.center , 
    org_isovistID: message.isovistID , 

    validCenters: listOfInside 
  }

*/
function processOriginalIntersection( message )
{ 
  console.assert( message.messageID == 1 , "Message ID wrong "); 
  console.assert( message.messageCheck == 0xBADFACE , " MEssage check missing or wrong "); 
  let center = message.center; 
  let polygon_in_VRD = message.thisIsovist ; 
  console.assert( polygon_in_VRD != null , "isovist bounds missing "); 
  let listOfCenters = message.isoivsits_centers_to_check ; 
  console.assert( Array.isArray( listOfCenters ), "The list of centers is not an array"); 
  let listOfInside = [] ; 
  const bbot = getBoundingBoxVRD( polygon_in_VRD ); 
  // be faster to do a in bounding box check first 
  //@@@ TODO - do bounding box check. 

  for( let point of  listOfCenters ) 
  { 
    if( pointInVRDPolygon( point, polygon_in_VRD ) == true)
    {
      listOfInside.push( point ); 
    }
  }
  console.log( `found  ${listOfInside.length} points inside polygon` ); 
  let response = { 
    messageID: message.messageID , 
    messageCheck:  message.messageCheck, 
    org_center:  message.center , 
    org_isovistID: message.isovistID , 

    validCenters: listOfInside 
  }
  postMessage(response);

}

console.log(" Worker  I AM INTEGRATIUON WORKER! "); 

//testIntersection(); // call test intersection from Geometry 
console.log(" Worker: I AM DONE  "  ); 
