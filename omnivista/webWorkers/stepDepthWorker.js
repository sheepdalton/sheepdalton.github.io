'use strict';
//importScripts("foo.js"); 

// 
/* 
      DISUSED 
*/ 
/*
    This woker computs the intergration from the starting 
    node to all other nodes. 

    returns data
*/ 
 

const NO_DEPTH = -1 ; 
const MAX_DEPTH_EVER = Number.MAX_SAFE_INTEGER -10 ; // not this valiue. 

let gGraph = null ; 
let gNodeLookupTable = { };  // fast lookup.
//let gDepth = { }; 


/*
let loadGraph = 
{
    messageID : 'LoadGraph' , 
    messageCheck : 0xC0FFE , 
   
    graph: [ 
                { nodeID:0 , connections: [ ]}
            ]

}

let stepDepthFrom = 
{ 
    messageID: 'StepUnitDepth', 
    messageCheck : 0xCAFEBABE , 
     startingNodeIndex : 0 , 
*/ 


onmessage = (e) => {
    //console.log("Message received from main script");
    //console.log(  messageFromWorker = e.data ) ; 
    //xconsole.log( typeof(  e.data ));
    const message = e.data ; 
    console.assert( message !== undefined  ," Message unde:90"); 
    console.assert( message !=null ,  "message null:91"); 
    console.assert( message.messageCheck !== undefined , "check failed 102" ); 
    console.assert( message.messageCheck == 0xCAFEBABE  , "MESSAGE IN WRONG FORMAT, 103"); 
    console.assert( Number.isInteger ( message.messageID  ),"NO MESSAGEID 104" ); 
    switch(message.messageID )
    { 
      case 1 : 
      { 
        handleLoadGraph( message );
        
        return ; 
      }break ; 
      case 2: 
      { 
        handleProcessNodeStepDepth( message ); 
        return ; 
      }
      case 3: 
      { 
         handleTotalDepthFrom( message ); 
         return ; 
      }

      default: 
      { 
          //console.log(Array.isArray(e.data)); 
            //let inputVec = e.data; 
            //console.log( "Item 0 " , inputVec[ 0 ] ); 
            // console.log( "Item 1 " , inputVec[ 1 ] ); 
            //const workerResult = "Result:"  + inputVec.join("::") ;
            const workerResult = "Intersection worker comment not understood." + message.messageID; 
            console.error(workerResult);
            postMessage(workerResult);
      }
    }
  };
//-------------------------------------------------------------
function nodeIsValid( node )
{ 
    if(node == null ) return false ; 
    if(node.DEBUG_check === undefined)return false ; 
    return node.DEBUG_check ==  0xf1eece ;  
}
//-------------------------------------------------------------
/*
  let step_depth_message_in = 
  {
    messageID :  2, 
    message: 'STEP_DEPTH', 
    messageCheck : 0xBADFACE,
    nodeToProcess: 5 
  }; 
*/
/*
 WRONG . 
  let step_depth_message_out = 
  { 
    messageID  : 100 , 
    messageCheck : 0xBADFACE,

    total_depth : number , 
    resultDepthTable [  { id: number , depth: number }]; 
  }

  This could be speeded up slightly by having a set to do the check to see if in. 
*/
function findStepDepthFrom( targetID)
{ 
  let depth_table = []  ; // reset the step depth.
  const target = gNodeLookupTable[ targetID ]; 
  //console.log("Target ", targetID ,"good =" , (target != null) , "t",target.nodeID ); 
  //console.log( "Connections = ",  target.edges.length  ); 
  console.assert( target.nodeID == targetID , "Target miss alignment"); 
  let unProcessed = [ target ] ; // actually a queue 

  for( let  nd in gGraph )
  {
    const thenode = gGraph[ nd ];  console.assert( nd == thenode.nodeID , "Graph format error"); 
    depth_table.push( MAX_DEPTH_EVER ) ; 
  }
  depth_table[ targetID  ] = 0 ; // the node is the index to the depth 
  console.assert(  depth_table[ targetID  ] == 0 , "Depth storage is broken." ); 
  // could possibly have a set to speed this up...

  while ( unProcessed.length> 0 ) 
  { // (unProcessed.length> 0  )
      const my  = unProcessed.shift();  
      
      console.assert(  my.nodeID < depth_table.length  , "The target is not in the table" );
      
      let  my_depth = MAX_DEPTH_EVER ; 
      my_depth =  depth_table[ my.nodeID ]; 
      const my_depth_plus_one = my_depth + 1 ; 
   
      //console.log("Processing node =  " + my.nodeID  + " d = " + my_depth + " n = "+ my.edges.length); 
      console.assert( Array.isArray( my.edges ), "Edges is not an array"); 
  ///@@@ TODO 
      //this seems to work -  we appear to have duplicate edges - might want to remove findDistSquardToClosestPointTo
      //2. check the items coming back are correct ( visualise )

      for( let tooNodeID  of my.edges ) // everything target is connected to.
      { 
            console.assert( Number.isInteger(  tooNodeID )==true ,
            "connection is not a nodeID. "  + tooNodeID  + " " + typeof tooNodeID );

            let connectedNode = gNodeLookupTable[ tooNodeID  ]; 

            console.assert( Number.isInteger(connectedNode.nodeID ), "Node is wrong");
            console.assert(connectedNode.nodeID == tooNodeID,"format of node error" ); 
            let  connectedDepth =  MAX_DEPTH_EVER ; 
            connectedDepth =  depth_table[ tooNodeID  ] ; 

            //console.log( " looking at tooNodeID " , tooNodeID ,connectedNode.nodeID, 
            //     " depth = ",  depth_table[ tooNodeID ] ,connectedDepth,   tooNodeID in depth_table );

            if(connectedDepth > my_depth_plus_one )
            { 
        
              depth_table[ tooNodeID ] = my_depth_plus_one; // move closer. 
              //if(false) console.log(`Reduce depth of ${tooNodeID} to  ${my_depth_plus_one}`); 
              if( !( connectedNode in unProcessed )  )// if not in que O(N)
              { 
                unProcessed.push(connectedNode); // add node to back of que 
              }
            }
      //unProcessed.push(  gNodeLookupTable ); 
      }
 }
 return  depth_table ; // [ node -> depth ]
}
//––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
/**colorByCurrentValue
 *  currentValue
 *  see messageRecivedFromGraphWorker(e)  in main code. 
 * @param {*} message 
 * @returns 
 */
 function  handleProcessNodeStepDepth( message )
 {
   console.log("Worker: handle step depth"); 

    console.assert( message.messageCheck == 0xCAFEBABE  , "FORMAT CHECK FAILED " ) ; 
    console.assert( message.message == 'STEP DEPTH', 'Errror in step depth message format');

    let targetID = message.nodeToProcess ;
    if(  gGraph == null  || gGraph.length < 2   )
    {
      console.error("Worker: the graph is not setup"); 
        let step_error = 
        { 
            messageID : 404 , 
            messageCheck : 0xBADFACE,
            messageText: 'Missing graph - you should load the graph before processing'
        }; 
        postMessage(step_error);
        return ; 
    }
    let depth_table = findStepDepthFrom( targetID ); 
    
    let result_depthTable = { }; 
    for(const nd_id of gGraph ) 
    { 
      console.assert( Number.isInteger(nd_id.nodeID)  ,
       "internal ordering problem (dev err) id=" + nd_id.nodeID ); 
      console.assert( nd_id.nodeID <  depth_table.length  , "No just no"); 
      
      const dpt = depth_table[ nd_id.nodeID ];
      result_depthTable[  nd_id.nodeID ] = dpt;
    }

    const  ProcessedOK = { 
      messageID  : 100  , 
      messageCheck:  0xBADFACE, 
      nodeToProcess: targetID , 
      resultDepthTable: result_depthTable 
    }
    postMessage(ProcessedOK );
    return ; 
 }
//-------------------------------------------------------------
function handleTotalDepthFrom( message )
{ 
  //console.log("Worker: handle TOTAL depth"); 

    console.assert( message.messageCheck == 0xCAFEBABE  , "FORMAT CHECK FAILED " ) ; 
    console.assert( message.message == 'TOTAL', 'Errror in step depth message format');

    let targetID = message.nodeToProcess ;
    if(  gGraph == null  || gGraph.length < 2   )
    {
      console.error("Worker: the graph is not setup"); 
        let step_error = 
        { 
            messageID : 404 , 
            messageCheck : 0xBADFACE,
            messageText: 'Missing graph - you should load the graph before processing'
        }; 
        postMessage(step_error);
        return ; 
    }
    let depth_table = findStepDepthFrom( targetID ); 
    
    let total_depth  = 0 ; 
    let radius3 = 0 ; 
    let connectivity_ = 0 ; 
    let reacheable_ = 0 ; 
    let disconnected_ = false ; 
    for(const nd_id of gGraph ) 
    { 
        console.assert( Number.isInteger(nd_id.nodeID)  ,
         "internal ordering problem (dev err) id=" + nd_id.nodeID ); 
        console.assert( nd_id.nodeID <  depth_table.length  , "No just no"); 

        const dpt = depth_table[ nd_id.nodeID ];
        if( dpt < MAX_DEPTH_EVER ) // unreachable 
        { 
          console.assert( dpt >= 0 ,"Impossible negative depth"); 
          total_depth += dpt; 
          if( dpt <= 3 ) radius3 += dpt; 
          if( dpt == 1)connectivity_ += 1; 
          reacheable_ += 1  ;  
        }else{
          disconnected_ = true ; 
        }
         // else there are unreachable nodes. the ssystem is split. 
    }

    const  ProcessedOK = { 
      messageID  : 101 , 
      messageCheck:  0xBADFACE, 
      nodeToProcess: targetID , 
      totalDepth :  total_depth , 
      radius3Total : radius3 , 
      connectivity: connectivity_ , 
      reacheable :  reacheable_, 
      disconnected: disconnected_ 

    }
    postMessage(ProcessedOK ); // -> messageRecivedFromGraphWorker
    return ; 
}
//-------------------------------------------------------------
/*
  let graph_worker_setup_message = 
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
 *  TODO - send message back saying complete. ad
 */


function  handleLoadGraph( message )
{ 
    console.assert( message.messageCheck == 0xCAFEBABE  , "FORMAT CHECK FAILED " ) ; 
    console.assert(  message.graph != null , "No null graphs"); 
    //console.log("Loading Graph LEN =",  message.graph.length  ); 
    gGraph =  message.graph;
    gNodeLookupTable = { } ;

    let node = null ; 
    for( let k in  gGraph )
    { 
        const node = gGraph[ k ]; 
        let listOfNumbers = [ ] ; 
        
        let edgeSet = new Set( ); // just set pratice. 
        
        for( let ed of node.edges) 
        { let n = Number(ed); 
          console.assert( Number.isInteger(n), "Number conversion problem 180"); 
          if(!edgeSet.has( n )  )
            { 
              listOfNumbers.push( n); // force conversion to number 
            } 
          edgeSet.add( n  ); 
        }
        node.nodeID  = Number(node.nodeID); //make sure number is actually a number.
        node.edges = listOfNumbers;
        node.edge_set = edgeSet;  // debug check.
        node.stepDepth =  10000 ; // create a new attribute. 
        node.totalDepth = 0 ; 
        node.DEBUG_check =  0xf1eece ; 
        gNodeLookupTable[ node.nodeID ] = node ; // lookup node.
      
       
    }

   // console.log("Graphs loaded " +  Object.keys(gNodeLookupTable).length ); 
  // @@@ TODO REMOVE THIS CHECK CODE.
    const OK_GO = 
    { 
            messageID : 400  , 
            messageCheck : 0xBADFACE,
            messageText: 'Graph loaded'
    }; 
    //console.log("Posting OK GO"); 
    postMessage( OK_GO ); //->  messageRecivedFromGraphWorker 
    
}
//processCompleteOK 
//-------------------------------------------------------------
//console.log(" Worker: I AM STEP DEPTH WORKER! "); 

//testIntersection(); // call test intersection from Geometry 
//console.log(" Worker: I AM DONE  "  ); 
